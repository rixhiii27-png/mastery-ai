import React from 'react';
import { ArrowLeft, GraduationCap, Loader2, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from '../components/BrandMark';

export const AuthPage: React.FC = () => {
  const { setPortalView, signInWithGoogle, authLoading, authError, enterDemo } = useApp();

  return (
    <div className="min-h-screen bg-[#FEFAE0] dark:bg-[#283618] text-[#1C2412] dark:text-[#FEFAE0] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setPortalView('landing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 hover:text-[#606C38] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to MASTERY AI
        </button>

        <div className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-7 sm:p-8 shadow-xl">
          <div className="mb-6">
            <BrandLogo lightText={false} />
            <h1 className="text-2xl font-bold text-[#283618] dark:text-[#FEFAE0] mt-4">
              Sign in to your Learning Workspace
            </h1>
            <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1.5 leading-relaxed">
              Your Living Learner Model, diagnostic history, spaced-repetition schedule, and saved notes sync securely to Cloud Firestore.
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] text-xs font-medium text-[#283618] dark:text-[#FEFAE0]/85">
              {authError}
            </div>
          )}

          <button
            type="button"
            disabled={authLoading}
            onClick={() => void signInWithGoogle()}
            className="w-full py-3 px-4 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-5 p-3.5 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed">
            <strong className="text-[#283618] dark:text-[#FEFAE0]">Security & Role Policy:</strong>{' '}
            Self-registration automatically provisions a <strong>Student</strong> account. Teacher classrooms and Parent links require verified authorization and cannot be elevated from the browser.
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#DDA15E]/30 dark:bg-[#606C38]" />
            <span className="text-xs font-medium text-[#606C38] dark:text-[#DDA15E]">
              Or explore synthetic demos
            </span>
            <div className="h-px flex-1 bg-[#DDA15E]/30 dark:bg-[#606C38]" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => enterDemo('student')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] hover:bg-[#DDA15E]/20 dark:hover:bg-[#606C38] border border-[#D8D3B4] dark:border-[#DDA15E]/60 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
              Student
            </button>
            <button
              type="button"
              onClick={() => enterDemo('teacher')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] hover:bg-[#DDA15E]/20 dark:hover:bg-[#606C38] border border-[#D8D3B4] dark:border-[#DDA15E]/60 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
              Teacher
            </button>
            <button
              type="button"
              onClick={() => enterDemo('parent')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#FEFAE0] dark:bg-[#606C38] hover:bg-[#DDA15E]/20 dark:hover:bg-[#606C38] border border-[#D8D3B4] dark:border-[#DDA15E]/60 text-xs font-semibold text-[#283618] dark:text-[#FEFAE0] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E]" />
              Parent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
