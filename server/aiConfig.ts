import { GoogleGenAI, ThinkingLevel, type Schema } from '@google/genai';
import type { z } from 'zod';

/**
 * Centralized Gemini Model Configuration.
 * Change GEMINI_MODEL_ID here to switch models across the entire platform.
 */
export const GEMINI_MODEL_ID = 'gemini-4-hydrogen';

export class AIServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: 'AI_CONFIG_MISSING' | 'AI_VALIDATION_ERROR' | 'AI_UPSTREAM_ERROR';

  constructor(
    message: string,
    code: 'AI_CONFIG_MISSING' | 'AI_VALIDATION_ERROR' | 'AI_UPSTREAM_ERROR',
    statusCode = 500
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIServiceError(
      'Gemini API is not configured on the server. Set GEMINI_API_KEY in server secrets to enable live AI tutoring and generation.',
      'AI_CONFIG_MISSING',
      503
    );
  }

  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }

  return cachedClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Unified Gemini structured JSON invocation with retries and Zod validation.
 * Never returns fabricated fallback output on failure.
 */
export async function invokeGeminiJson<T>(params: {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Schema;
  validator: z.ZodType<T>;
  thinkingLevel?: ThinkingLevel;
}): Promise<T> {
  const ai = getGeminiClient();
  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_ID,
        contents: params.userPrompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
          thinkingConfig: {
            thinkingLevel: params.thinkingLevel ?? ThinkingLevel.LOW,
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new AIServiceError('Model returned an empty response.', 'AI_VALIDATION_ERROR', 502);
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        throw new AIServiceError('Model returned malformed JSON output.', 'AI_VALIDATION_ERROR', 502);
      }

      const validated = params.validator.safeParse(parsedJson);
      if (!validated.success) {
        throw new AIServiceError(
          `Model output failed schema validation: ${validated.error.issues[0]?.message ?? 'invalid structure'}`,
          'AI_VALIDATION_ERROR',
          502
        );
      }

      return validated.data;
    } catch (err) {
      lastError = err;
      if (err instanceof AIServiceError && err.code === 'AI_CONFIG_MISSING') {
        throw err;
      }
      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
      }
    }
  }

  if (lastError instanceof AIServiceError) {
    throw lastError;
  }

  const message =
    lastError instanceof Error ? lastError.message : 'Unexpected upstream error calling Gemini API.';
  throw new AIServiceError(`Gemini request failed: ${message}`, 'AI_UPSTREAM_ERROR', 502);
}
