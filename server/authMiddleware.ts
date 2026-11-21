import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { NextFunction, Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface FirebaseConfigSubset {
  projectId?: string;
}

function loadProjectId(): string {
  try {
    const cfgPath = path.resolve(__dirname, '../firebase-applet-config.json');
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const parsed = JSON.parse(raw) as FirebaseConfigSubset;
    return parsed.projectId || '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadProjectId();

// Trusted curriculum administrators (env-configurable + project owner email)
function getTrustedAdminEmails(): Set<string> {
  const defaults = ['rixhiii27@gmail.com'];
  const fromEnv = (process.env.CURRICULUM_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...defaults, ...fromEnv]);
}

export interface VerifiedAuthContext {
  authenticated: boolean;
  isDemo: boolean;
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authContext?: VerifiedAuthContext;
    }
  }
}

let cachedCerts: Record<string, string> | null = null;
let certsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < certsExpiresAt) {
    return cachedCerts;
  }

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Unable to fetch Firebase public signing certificates (${res.status}).`);
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const ttlSeconds = maxAgeMatch ? Math.max(60, Number(maxAgeMatch[1])) : 3600;

  const certs = (await res.json()) as Record<string, string>;
  cachedCerts = certs;
  certsExpiresAt = now + ttlSeconds * 1000;
  return certs;
}

function base64UrlDecodeToBuffer(segment: string): Buffer {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

/**
 * Cryptographically verifies a Firebase Auth ID token (RS256) against Google's
 * official Firebase X.509 signing certificates without requiring GCP IAM roles.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<{
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
}> {
  if (!FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID === 'remixed-project-id') {
    throw new Error('Firebase projectId is not configured on the server.');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase ID token.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecodeToBuffer(headerB64).toString('utf8')) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString('utf8')) as {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
    admin?: boolean;
  };

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Invalid Firebase ID token signing algorithm or key ID.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase ID token has expired.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Firebase ID token issued-at timestamp is invalid.');
  }
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Firebase ID token audience does not match this project.');
  }
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error('Firebase ID token issuer mismatch.');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Firebase ID token missing subject UID.');
  }

  const certs = await getFirebasePublicCerts();
  const publicCert = certs[header.kid];
  if (!publicCert) {
    throw new Error('Unknown Firebase ID token signing key ID.');
  }

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8');
  const signature = base64UrlDecodeToBuffer(signatureB64);
  const valid = crypto.verify('RSA-SHA256', signingInput, publicCert, signature);
  if (!valid) {
    throw new Error('Firebase ID token cryptographic signature verification failed.');
  }

  const email = (payload.email || '').toLowerCase();
  const emailVerified = Boolean(payload.email_verified);
  const adminEmails = getTrustedAdminEmails();
  const isAdmin = Boolean(payload.admin === true || (emailVerified && adminEmails.has(email)));

  return {
    uid: payload.sub,
    email,
    emailVerified,
    isAdmin,
  };
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Authenticates protected AI endpoints.
 * - If an Authorization Bearer token is present, it MUST pass full cryptographic verification.
 * - Allows explicit Demo Mode (`X-Mastery-Demo-Mode: true`) for unauthenticated evaluation sessions.
 */
export async function requireAuthOrDemo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req);
  const isDemoHeader = req.headers['x-mastery-demo-mode'] === 'true';

  if (token) {
    try {
      const verified = await verifyFirebaseIdToken(token);
      req.authContext = {
        authenticated: true,
        isDemo: false,
        ...verified,
      };
      next();
      return;
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : 'Invalid Firebase authentication token.',
        code: 'UNAUTHORIZED',
      });
      return;
    }
  }

  if (isDemoHeader) {
    req.authContext = {
      authenticated: false,
      isDemo: true,
      uid: 'demo_evaluator',
      email: 'demo@masteryai.edu',
      emailVerified: false,
      isAdmin: false,
    };
    next();
    return;
  }

  res.status(401).json({
    error: 'Authentication required. Sign in with Firebase or enter Demo Mode to access AI endpoints.',
    code: 'UNAUTHORIZED',
  });
}

/**
 * Protects curriculum administration endpoints (`POST /api/curriculum/import`).
 * - Verifies Firebase ID token and restricts production writes to verified curriculum administrators.
 * - Rejects authenticated non-admin users (students/teachers/parents) with HTTP 403.
 * - Allows explicit Demo Mode dry-run sandbox requests clearly marked as `demo_sandbox`.
 */
export async function requireCurriculumAdminOrDemoSandbox(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req);
  const isDemoHeader = req.headers['x-mastery-demo-mode'] === 'true';

  if (token) {
    try {
      const verified = await verifyFirebaseIdToken(token);
      if (!verified.isAdmin) {
        res.status(403).json({
          error:
            'Curriculum administration is restricted to verified administrators. Student, teacher, and parent accounts have read-only curriculum access.',
          code: 'FORBIDDEN_CURRICULUM_ADMIN',
        });
        return;
      }
      req.authContext = {
        authenticated: true,
        isDemo: false,
        ...verified,
      };
      next();
      return;
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : 'Invalid Firebase authentication token.',
        code: 'UNAUTHORIZED',
      });
      return;
    }
  }

  if (isDemoHeader) {
    req.authContext = {
      authenticated: false,
      isDemo: true,
      uid: 'demo_sandbox',
      email: 'demo_sandbox@masteryai.edu',
      emailVerified: false,
      isAdmin: false,
    };
    next();
    return;
  }

  res.status(401).json({
    error: 'Firebase administrator authentication is required for curriculum ingestion.',
    code: 'UNAUTHORIZED',
  });
}
