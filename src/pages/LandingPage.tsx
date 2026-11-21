import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Moon,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo, CircularMasteryRing } from '../components/BrandMark';

export const LandingPage: React.FC = () => {
  const { setPortalView, enterDemo, theme, toggleTheme } = useApp();

  return (
    <div className="min-h-screen bg-[#FEFAE0] dark:bg-[#283618] text-[#1C2412] dark:text-[#FEFAE0]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FEFAE0]/95 dark:bg-[#283618]/95 backdrop-blur-md border-b border-[#D8D3B4] dark:border-[#606C38]/60">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          <a href="#top" className="shrink-0">
            <BrandLogo lightText={false} />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#283618] dark:text-[#FEFAE0]/90">
            <a href="#features" className="hover:text-[#606C38] dark:hover:text-[#DDA15E] transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#606C38] dark:hover:text-[#DDA15E] transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#learner-model" className="hover:text-[#606C38] dark:hover:text-[#DDA15E] transition-colors whitespace-nowrap shrink-0">
              Learner Model
            </a>
            <a href="#ecosystem" className="hover:text-[#606C38] dark:hover:text-[#DDA15E] transition-colors whitespace-nowrap shrink-0">
              Portals
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setPortalView('auth')}
            className="px-4 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Learning
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#606C38] dark:text-[#DDA15E]">
                <span>CBSE 2026–27 · Classes 10, 11 & 12</span>
                <span aria-hidden="true">·</span>
                <span>309 Official Subjects</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="ml-auto inline-flex items-center gap-1.5 text-[#283618] dark:text-[#FEFAE0] hover:text-[#BC6C25] dark:hover:text-[#DDA15E] cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08] text-[#283618] dark:text-[#FEFAE0]"
                style={{ textWrap: 'balance' }}
              >
                Learn Smarter. Master Every Concept.
              </h1>

              <p className="text-lg text-[#4A543B] dark:text-[#FEFAE0]/85 max-w-xl leading-relaxed">
                An AI tutor that learns how you learn. MASTERY AI maps your concept-level understanding across the complete CBSE 2026–27 academic and skill curriculum, uncovers misconceptions, and adapts every lesson and revision plan to your real progress.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPortalView('auth')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] font-semibold text-sm shadow-lg shadow-[#283618]/20 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => enterDemo('student')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] hover:border-[#606C38] dark:hover:border-[#DDA15E] text-[#283618] dark:text-[#FEFAE0] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explore Demo
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#4A543B] dark:text-[#FEFAE0]/80">
                <span>Deterministic Mastery Scoring</span>
                <span aria-hidden="true">·</span>
                <span>Academic & Skill Education</span>
                <span aria-hidden="true">·</span>
                <span>Student, Teacher & Parent Portals</span>
              </div>
            </div>

            {/* Interactive Dashboard Preview Anchor */}
            <div className="lg:col-span-6">
              <div className="rounded-[22px] bg-[#283618] p-5 sm:p-6 border border-[#606C38] shadow-2xl text-[#FEFAE0]">
                <div className="rounded-2xl bg-gradient-to-r from-[#283618] via-[#606C38] to-[#BC6C25]/85 p-5 mb-5 border border-[#DDA15E]/30">
                  <p className="text-xs font-medium text-[#DDA15E]">Living Learner Model Preview · CBSE 2026–27</p>
                  <h2 className="text-xl font-bold text-[#FEFAE0] mt-1">Class 10–12 Concept Mastery Map</h2>
                  <p className="text-xs text-[#FEFAE0]/90 mt-1.5 max-w-md">
                    Every completed diagnostic and lesson knowledge check updates mastery deterministically and schedules spaced revision automatically.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="rounded-2xl bg-[#334220] border border-[#606C38] py-2">
                    <CircularMasteryRing percent={92} label="Ohm's Law" sublabel="Mastered" size={68} />
                  </div>
                  <div className="rounded-2xl bg-[#334220] border border-[#606C38] py-2">
                    <CircularMasteryRing percent={74} label="Factorisation" sublabel="Proficient" size={68} />
                  </div>
                  <div className="rounded-2xl bg-[#334220] border border-[#DDA15E]/60 py-2">
                    <CircularMasteryRing percent={42} label="Discriminant" sublabel="Review Today" size={68} />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#1F2A12] border border-[#606C38] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#DDA15E]">Misconception Hypothesis Detected</p>
                    <p className="text-xs text-[#FEFAE0]/90 mt-1">
                      Evaluates (-b)² as negative when solving D = b² - 4ac = 0. Confidence: 72%.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => enterDemo('student')}
                    className="px-3.5 py-2 rounded-xl bg-[#DDA15E] hover:bg-[#BC6C25] text-[#283618] hover:text-[#FEFAE0] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Try Live Loop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section id="features" className="py-16 lg:py-20 border-t border-[#D8D3B4] dark:border-[#606C38]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] mb-2">
              Complete Learning Ecosystem
            </p>
            <h2 className="text-3xl font-bold text-[#283618] dark:text-[#FEFAE0]">
              Built for genuine concept mastery across every CBSE stream.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: 'Lesson-Grounded AI Tutor',
                desc: 'Bounded CBSE 2026–27 lesson retrieval calibrated to Beginner, Simple, Detailed, or Exam Prep modes—with Hint-First guidance and natural off-chapter support.',
              },
              {
                icon: ClipboardCheck,
                title: 'Diagnostic & Gap Detection',
                desc: 'Pinpoints weak concepts one question at a time, explains solutions transparently, and surfaces testable misconception hypotheses.',
              },
              {
                icon: Brain,
                title: 'Adaptive Practice Engine',
                desc: 'Scales difficulty dynamically between Foundational, Standard, Application, and Challenge tiers using validated performance evidence.',
              },
              {
                icon: CalendarClock,
                title: 'Deterministic Revision Planner',
                desc: 'Spaced-repetition scheduler prioritizes missed concepts immediately and extends recall intervals (1, 3, 7, 14, 30 days) on mastery.',
              },
              {
                icon: BookOpen,
                title: 'Full 2026–27 Curriculum Explorer',
                desc: 'Covers Main Academic Subjects, Languages, Academic Electives (Science, Commerce, Humanities), and Skill Education across Classes 10, 11, and 12.',
              },
              {
                icon: GraduationCap,
                title: 'Timed CBSE Exam Simulator',
                desc: 'Practice under realistic timed conditions with question navigation, marking review, deterministic scoring, and weak-topic action plans.',
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-[18px] p-6 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#606C38] dark:text-[#DDA15E] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0] mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How the Living Learner Model Works */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-[#283618] text-[#FEFAE0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="learner-model" className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold text-[#DDA15E]">Central Innovation</p>
              <h2 className="text-3xl font-bold text-[#FEFAE0]">
                The Living Learner Model
              </h2>
              <p className="text-sm text-[#FEFAE0]/85 leading-relaxed">
                MASTERY AI separates natural-language pedagogy from deterministic scorekeeping. Gemini 4 Hydrogen authors original explanations and misconception hypotheses, while auditable application math computes mastery, prevents duplicate submissions, and schedules spaced revisions.
              </p>
              <div className="rounded-2xl bg-[#1F2A12] border border-[#606C38] p-5 mt-4">
                <p className="text-xs text-[#DDA15E] font-semibold mb-1.5">
                  Deterministic Mastery Formula
                </p>
                <p className="font-mono text-sm text-[#FEFAE0] tabular-nums">
                  New Mastery = (0.7 × Previous) + (0.3 × Validated Score)
                </p>
                <p className="text-xs text-[#FEFAE0]/75 mt-2">
                  Bounded strictly to 0–100 and applied only after validated assessment or lesson knowledge-check evidence.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                { step: '01', title: 'Explore Official Syllabus', body: 'Navigate Class 10, 11, or 12 across Academic, Language, and Skill subjects down to individual lessons.' },
                { step: '02', title: 'Learn & Check Understanding', body: 'Study original AI lesson walkthroughs, worked examples, and take interactive knowledge checks.' },
                { step: '03', title: 'Transactional Model Update', body: 'Firestore transactions record evidence and update concept mastery without double-counting.' },
                { step: '04', title: 'Adaptation & Spaced Recall', body: 'Difficulty adjusts automatically and the Revision Planner sets your next spaced review date.' },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl p-5 bg-[#334220] border border-[#606C38]"
                >
                  <span className="font-mono text-xs font-bold text-[#DDA15E]">{s.step}</span>
                  <h3 className="text-base font-bold text-[#FEFAE0] mt-1 mb-1.5">{s.title}</h3>
                  <p className="text-xs text-[#FEFAE0]/85 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three Role-Based Portals */}
      <section id="ecosystem" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] mb-2">
              Three Connected Portals
            </p>
            <h2 className="text-3xl font-bold text-[#283618] dark:text-[#FEFAE0]">
              Privacy-first visibility for Students, Teachers, and Parents.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: 'student' as const,
                icon: GraduationCap,
                title: 'Student Portal',
                points: [
                  'Personalized Living Learner Model dashboard',
                  'Full CBSE 2026–27 Curriculum Explorer & Lesson Studio',
                  'AI Tutor, Diagnostics, Adaptive Practice & Exam Simulator',
                ],
                cta: 'Launch Student Demo',
              },
              {
                role: 'teacher' as const,
                icon: Users,
                title: 'Teacher Portal',
                points: [
                  'Class-wide chapter & lesson mastery analytics',
                  'Aggregated common learning gaps & misconception reports',
                  'Private student tutor chats stay strictly confidential',
                ],
                cta: 'Launch Teacher Demo',
              },
              {
                role: 'parent' as const,
                icon: ShieldCheck,
                title: 'Parent Portal',
                points: [
                  'Clear weekly study summaries & revision adherence',
                  'Weak lessons & concepts requiring gentle attention',
                  'Real access requires verified student-approved linking',
                ],
                cta: 'Launch Parent Demo',
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.role}
                  className="rounded-[18px] p-6 bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] flex flex-col"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#606C38] dark:text-[#DDA15E] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0] mb-3">
                    {p.title}
                  </h3>
                  <ul className="space-y-2.5 text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 mb-6 flex-1">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => enterDemo(p.role)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#606C38] hover:bg-[#283618] dark:bg-[#DDA15E] dark:hover:bg-[#BC6C25] text-[#FEFAE0] dark:text-[#283618] text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {p.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-10 border-t border-[#D8D3B4] dark:border-[#606C38]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4A543B] dark:text-[#FEFAE0]/80">
          <BrandLogo lightText={false} />
          <p>MASTERY AI — Adaptive CBSE Classes 10–12 (2026–27) Learning Platform. An AI tutor that learns how you learn.</p>
        </div>
      </footer>
    </div>
  );
};
