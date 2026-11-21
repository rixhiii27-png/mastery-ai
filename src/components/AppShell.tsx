import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarClock,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Target,
  Timer,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandMark';
import { searchCurriculumApi } from '../services/aiClient';
import type { CurriculumSearchHit, ParentPage, StudentPage, TeacherPage } from '../types/mastery';

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const STUDENT_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tutor', label: 'AI Tutor', icon: Bot },
  { id: 'my-learning', label: 'My Learning', icon: GraduationCap },
  { id: 'curriculum', label: 'Curriculum', icon: Compass },
  { id: 'diagnostic', label: 'Diagnostic', icon: ClipboardCheck },
  { id: 'practice', label: 'Practice', icon: Target },
  { id: 'materials', label: 'Study Materials', icon: FileText },
  { id: 'exam', label: 'Exam Simulator', icon: Timer },
  { id: 'revision', label: 'Revision Planner', icon: CalendarClock },
  { id: 'progress', label: 'My Progress', icon: BarChart3 },
];

const MOBILE_BOTTOM_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'tutor', label: 'Tutor', icon: Bot },
  { id: 'curriculum', label: 'Syllabus', icon: Compass },
  { id: 'revision', label: 'Revise', icon: CalendarClock },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
];

const TEACHER_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Class Performance', icon: BarChart3 },
  { id: 'gaps', label: 'Gaps & Misconceptions', icon: Target },
  { id: 'assessments', label: 'Assessment Analytics', icon: ClipboardCheck },
];

const PARENT_NAV: NavItem[] = [
  { id: 'overview', label: 'Student Overview', icon: LayoutDashboard },
  { id: 'progress', label: 'Subject Progress', icon: BookOpen },
  { id: 'reports', label: 'Weekly Reports', icon: BarChart3 },
  { id: 'linking', label: 'Permissions & Link', icon: ShieldCheck },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    theme,
    toggleTheme,
    portalView,
    studentPage,
    setStudentPage,
    teacherPage,
    setTeacherPage,
    parentPage,
    setParentPage,
    userProfile,
    isDemoMode,
    enterDemo,
    logout,
    resetDemoState,
    jumpToStudentPage,
    toast,
    clearToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHits, setSearchHits] = useState<CurriculumSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const navItems =
    portalView === 'student' ? STUDENT_NAV : portalView === 'teacher' ? TEACHER_NAV : PARENT_NAV;

  const activeId =
    portalView === 'student' ? studentPage : portalView === 'teacher' ? teacherPage : parentPage;

  const handleNavClick = (id: string) => {
    if (portalView === 'student') setStudentPage(id as StudentPage);
    if (portalView === 'teacher') setTeacherPage(id as TeacherPage);
    if (portalView === 'parent') setParentPage(id as ParentPage);
    setMobileMenuOpen(false);
  };

  // Curriculum-wide search against CBSE 2026-27 backend (Subjects, Chapters, Lessons, Topics, Concepts)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2 || portalView !== 'student') {
      setSearchHits([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchCurriculumApi({
        query: q,
        session: '2026-27',
        limit: 8,
      })
        .then((res) => {
          if (!cancelled) setSearchHits(res.hits);
        })
        .catch(() => {
          if (!cancelled) setSearchHits([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, portalView]);

  const activeLabel = navItems.find((i) => i.id === activeId)?.label ?? 'Dashboard';

  const displayName =
    portalView === 'teacher'
      ? 'Ms. Kavita Iyer'
      : portalView === 'parent'
      ? 'Mr. Rajesh Sharma'
      : userProfile?.displayName ?? 'Student';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#FEFAE0] dark:bg-[#283618] text-[#1C2412] dark:text-[#FEFAE0] overflow-x-hidden">
      {/* Desktop Sidebar — Dark Olive (#283618) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[252px] lg:fixed lg:inset-y-0 bg-[#283618] text-[#FEFAE0] border-r border-[#606C38]/50 z-30">
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#606C38]/40">
          <BrandLogo lightText />
        </div>

        {/* Portal Switcher in Demo Mode */}
        {isDemoMode && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-medium text-[#DDA15E] mb-2 px-1">
              Demo Portal Switcher
            </p>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#1E2912]">
              {(['student', 'teacher', 'parent'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => enterDemo(role)}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    portalView === role
                      ? 'bg-[#606C38] text-[#FEFAE0]'
                      : 'text-[#FEFAE0]/75 hover:text-[#FEFAE0]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#606C38] text-[#FEFAE0] shadow-sm'
                    : 'text-[#FEFAE0]/85 hover:bg-[#334220] hover:text-[#FEFAE0]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#DDA15E]' : 'text-[#DDA15E]/80'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#606C38]/40 space-y-1.5">
          {isDemoMode && (
            <button
              type="button"
              onClick={resetDemoState}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#FEFAE0]/85 hover:bg-[#334220] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#DDA15E]" />
              Reset Demo Data
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#FEFAE0]/85 hover:bg-[#334220] hover:text-[#FEFAE0] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#DDA15E]" />
            <span>{isDemoMode ? 'Exit Demo' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#1B2510]/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-[#283618] text-[#FEFAE0] flex flex-col h-full shadow-2xl z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#606C38]/50">
              <BrandLogo lightText />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-[#FEFAE0] hover:bg-[#334220] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isDemoMode && (
              <div className="px-4 pt-3 pb-2">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#1E2912]">
                  {(['student', 'teacher', 'parent'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        enterDemo(role);
                        setMobileMenuOpen(false);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                        portalView === role ? 'bg-[#606C38] text-[#FEFAE0]' : 'text-[#FEFAE0]/75'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                      isActive ? 'bg-[#606C38] text-[#FEFAE0]' : 'text-[#FEFAE0]/85 hover:bg-[#334220]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#DDA15E]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-[#606C38]/50">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#FEFAE0]/85 hover:bg-[#334220] cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#DDA15E]" />
                {isDemoMode ? 'Exit Demo' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[252px]">
        <header className="sticky top-0 z-20 h-16 px-4 md:px-7 flex items-center justify-between gap-4 bg-[#FEFAE0]/95 dark:bg-[#283618]/95 backdrop-blur-md border-b border-[#D8D3B4] dark:border-[#606C38]/60">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-xl text-[#283618] dark:text-[#FEFAE0] hover:bg-[#DDA15E]/25 dark:hover:bg-[#334220] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-[#283618] dark:text-[#FEFAE0] truncate">
                {activeLabel}
              </h1>
              {isDemoMode && (
                <p className="text-[11px] font-medium text-[#BC6C25] dark:text-[#DDA15E] truncate">
                  Demo Data · CBSE 2026–27 · Synthetic {portalView} session
                </p>
              )}
            </div>
          </div>

          {/* Curriculum-Wide Live Search (Subjects, Chapters, Lessons, Topics, Concepts) */}
          {portalView === 'student' && (
            <div className="relative hidden md:block flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search CBSE 2026-27 subjects, lessons, or concepts..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0] placeholder:text-[#606C38]/70 dark:placeholder:text-[#FEFAE0]/60 focus:outline-none focus:ring-2 focus:ring-[#606C38] dark:focus:ring-[#DDA15E]"
              />
              {searchFocused && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] shadow-xl overflow-hidden z-40">
                  {searching ? (
                    <p className="px-4 py-3 text-xs text-[#606C38] dark:text-[#FEFAE0]/80">
                      Searching CBSE 2026–27 catalogue...
                    </p>
                  ) : searchHits.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[#606C38] dark:text-[#FEFAE0]/80">
                      No matching subjects, chapters, lessons, or concepts found.
                    </p>
                  ) : (
                    searchHits.map((hit) => (
                      <button
                        key={`${hit.hitType}_${hit.id}`}
                        type="button"
                        onMouseDown={() => {
                          jumpToStudentPage('curriculum', {
                            classLevel: hit.classLevel,
                            subject: hit.subjectName,
                            subjectId: hit.subjectId,
                            chapterId: hit.chapterId ?? '',
                            lessonId: hit.lessonId,
                            lessonTitle: hit.hitType === 'lesson' ? hit.title : undefined,
                          });
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#FEFAE0] dark:hover:bg-[#283618] transition-colors flex items-center justify-between gap-2 cursor-pointer border-b last:border-b-0 border-[#ECE8CE] dark:border-[#606C38]/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0] truncate">
                            {hit.title}
                          </p>
                          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/75 truncate">
                            {hit.subtitle}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold capitalize text-[#BC6C25] dark:text-[#DDA15E] shrink-0">
                          {hit.hitType}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="p-2.5 rounded-xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#DDA15E] hover:border-[#606C38] dark:hover:border-[#DDA15E] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-xl bg-[#606C38] dark:bg-[#DDA15E] text-[#FEFAE0] dark:text-[#283618] font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-[#283618] dark:text-[#FEFAE0] whitespace-nowrap">
                  {displayName}
                </p>
                <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/75 whitespace-nowrap">
                  {portalView === 'student'
                    ? `Class ${userProfile?.classLevel ?? '10'} CBSE · 2026–27`
                    : portalView === 'teacher'
                    ? 'Faculty Portal'
                    : 'Parent Portal'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Persistent Demo Disclosure Strip */}
        {isDemoMode && (
          <div className="px-4 md:px-7 py-2 bg-[#DDA15E]/20 dark:bg-[#334220] border-b border-[#D8D3B4] dark:border-[#606C38]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#283618] dark:text-[#FEFAE0] font-medium">
              Demo Mode Active — Synthetic learner telemetry with live CBSE 2026–27 curriculum backend, Living Learner Model, and Gemini 4 Hydrogen AI.
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {portalView !== 'student' && (
                <button
                  type="button"
                  onClick={() => enterDemo('student')}
                  className="font-semibold text-[#BC6C25] dark:text-[#DDA15E] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Open Student Demo
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                className="font-semibold text-[#283618] dark:text-[#FEFAE0] hover:underline cursor-pointer whitespace-nowrap"
              >
                Sign in with Real Account
              </button>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-7 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {portalView === 'student' && (
          <nav
            aria-label="Mobile quick navigation"
            className="lg:hidden fixed bottom-0 inset-x-0 z-20 h-15 bg-[#283618] border-t border-[#606C38]/60 grid grid-cols-5 px-1"
          >
            {MOBILE_BOTTOM_NAV.map((item) => {
              const Icon = item.icon;
              const active = studentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStudentPage(item.id as StudentPage)}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                    active ? 'text-[#DDA15E]' : 'text-[#FEFAE0]/75'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 max-w-sm rounded-2xl px-4 py-3 shadow-xl border flex items-center gap-3 bg-[#283618] text-[#FEFAE0] border-[#DDA15E]/60"
        >
          <span className="text-sm font-medium leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={clearToast}
            aria-label="Dismiss notification"
            className="p-1 text-[#DDA15E] hover:text-[#FEFAE0] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
