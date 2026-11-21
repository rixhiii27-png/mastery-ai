import React from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AITutorPage } from './pages/student/AITutorPage';
import { MyLearningPage } from './pages/student/MyLearningPage';
import { CurriculumExplorerPage } from './pages/student/CurriculumExplorerPage';
import { DiagnosticPage } from './pages/student/DiagnosticPage';
import { PracticeQuestionsPage } from './pages/student/PracticeQuestionsPage';
import { StudyMaterialsPage } from './pages/student/StudyMaterialsPage';
import { ExamSimulatorPage } from './pages/student/ExamSimulatorPage';
import { RevisionPlannerPage } from './pages/student/RevisionPlannerPage';
import { MyProgressPage } from './pages/student/MyProgressPage';
import { TeacherPortal } from './pages/teacher/TeacherPortal';
import { ParentPortal } from './pages/parent/ParentPortal';

const PortalRouter: React.FC = () => {
  const { authReady, portalView, studentPage, firebaseUser, isDemoMode } = useApp();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFAE0] dark:bg-[#283618] text-[#283618] dark:text-[#FEFAE0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#606C38] dark:text-[#DDA15E]" />
          <p className="text-sm font-semibold">Loading MASTERY AI...</p>
        </div>
      </div>
    );
  }

  if (portalView === 'landing') {
    return <LandingPage />;
  }

  if (portalView === 'auth') {
    return <AuthPage />;
  }

  // Protected route guard: require Firebase authentication OR explicit Demo Mode
  if (!firebaseUser && !isDemoMode) {
    return <AuthPage />;
  }

  const renderStudentPage = () => {
    switch (studentPage) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'tutor':
        return <AITutorPage />;
      case 'my-learning':
        return <MyLearningPage />;
      case 'curriculum':
        return <CurriculumExplorerPage />;
      case 'diagnostic':
        return <DiagnosticPage />;
      case 'practice':
        return <PracticeQuestionsPage />;
      case 'materials':
        return <StudyMaterialsPage />;
      case 'exam':
        return <ExamSimulatorPage />;
      case 'revision':
        return <RevisionPlannerPage />;
      case 'progress':
        return <MyProgressPage />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <AppShell>
      {portalView === 'student' && renderStudentPage()}
      {portalView === 'teacher' && <TeacherPortal />}
      {portalView === 'parent' && <ParentPortal />}
    </AppShell>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <PortalRouter />
      </AppProvider>
    </ErrorBoundary>
  );
}
