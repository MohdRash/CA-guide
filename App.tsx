import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import ExamScreen from './components/ExamScreen';
import ResultsScreen from './components/ResultsScreen';
import ClassesScreen from './components/ClassesScreen';
import PracticeQuizScreen from './components/PracticeQuizScreen';
import { generateExamQuestions } from './services/gemini';
import { ExamConfig, ExamState, Language } from './types';
import { BookOpen, GraduationCap, Languages } from 'lucide-react';

const initialState: ExamState = {
  status: 'idle',
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  flagged: {},
  startTime: null,
  timeRemaining: 0,
  score: 0,
};

type AppMode = 'EXAM' | 'CLASSES' | 'PRACTICE';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('EXAM');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [examState, setExamState] = useState<ExamState>(initialState);
  const [config, setConfig] = useState<ExamConfig | null>(null);

  // Timer Effect
  useEffect(() => {
    let timer: number;
    if (examState.status === 'active' && examState.timeRemaining > 0) {
      timer = window.setInterval(() => {
        setExamState((prev) => {
          if (prev.timeRemaining <= 1) {
            // Auto submit when time runs out
            return { ...prev, timeRemaining: 0, status: 'finished', score: calculateScore(prev) };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examState.status, examState.timeRemaining]);

  const calculateScore = (state: ExamState): number => {
    let score = 0;
    state.questions.forEach((q, idx) => {
      if (state.answers[idx] === q.correctOptionIndex) {
        score++;
      }
    });
    return score;
  };

  const startQuizGeneration = async (newConfig: ExamConfig, targetMode: AppMode) => {
    setMode(targetMode);
    setConfig(newConfig);
    setExamState((prev) => ({ ...prev, status: 'loading' }));

    try {
      const questions = await generateExamQuestions(
        newConfig.subject,
        newConfig.level,
        newConfig.questionCount,
        newConfig.language,
        newConfig.topic
      );

      setExamState({
        ...initialState,
        status: 'active',
        questions,
        timeRemaining: newConfig.durationMinutes * 60,
        startTime: Date.now(),
      });
    } catch (error) {
      console.error(error);
      setExamState((prev) => ({ 
        ...prev, 
        status: 'idle', 
        error: "Failed to generate exam. Please try again." 
      }));
      alert("Failed to connect to CA Guide. Please check your API Key and try again.");
    }
  };

  const handleStartSimulator = (newConfig: ExamConfig) => {
    startQuizGeneration(newConfig, 'EXAM');
  };

  const handleStartPractice = (newConfig: ExamConfig) => {
    startQuizGeneration(newConfig, 'PRACTICE');
  };

  const handleExitPractice = () => {
    if (window.confirm("Are you sure you want to exit? Your practice progress will be lost.")) {
      setMode('CLASSES');
      setExamState(initialState);
      setConfig(null);
    }
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setExamState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionIndex]: optionIndex },
    }));
  };

  const handleFlag = (questionIndex: number) => {
    setExamState((prev) => ({
      ...prev,
      flagged: { ...prev.flagged, [questionIndex]: !prev.flagged[questionIndex] },
    }));
  };

  const handleNavigate = (questionIndex: number) => {
    setExamState((prev) => ({
      ...prev,
      currentQuestionIndex: questionIndex,
    }));
  };

  const handleSubmit = () => {
    setExamState((prev) => ({
      ...prev,
      status: 'finished',
      score: calculateScore(prev),
    }));
  };

  const handleRestart = () => {
    setExamState(initialState);
    setConfig(null);
    if (mode === 'PRACTICE') {
      setMode('CLASSES');
    }
  };

  const renderContent = () => {
    // 1. Practice Mode Logic
    if (mode === 'PRACTICE') {
      if (examState.status === 'loading') {
        return (
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-violet-50">
             <div className="text-center">
                <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-violet-900 font-bold text-lg">Preparing Practice Session...</h3>
                <p className="text-violet-600 text-sm">Generating questions for {config?.topic}</p>
             </div>
          </div>
        );
      }
      if (examState.status === 'active') {
        return (
          <PracticeQuizScreen
            state={examState}
            onAnswer={handleAnswer}
            onNavigate={handleNavigate}
            onSubmit={handleSubmit}
            onExit={handleExitPractice}
            title={config?.topic}
          />
        );
      }
      // Results are shared
      if (examState.status === 'finished' && config) {
        return (
          <ResultsScreen
            state={examState}
            config={config}
            onRestart={handleRestart}
          />
        );
      }
      // Fallback
      return null;
    }

    // 2. Classes Mode Logic
    if (mode === 'CLASSES') {
      return (
        <ClassesScreen 
          onStartQuiz={handleStartPractice} 
          language={language}
        />
      );
    }

    // 3. Exam Simulator Logic (Default)
    if (examState.status === 'idle' || examState.status === 'loading') {
      return (
        <SetupScreen 
          onStartExam={handleStartSimulator} 
          isLoading={examState.status === 'loading'} 
          language={language}
        />
      );
    } else if (examState.status === 'active') {
      return (
        <ExamScreen
          state={examState}
          onAnswer={handleAnswer}
          onFlag={handleFlag}
          onNavigate={handleNavigate}
          onSubmit={handleSubmit}
          title={config?.topic}
        />
      );
    } else {
      return config && (
        <ResultsScreen
          state={examState}
          config={config}
          onRestart={handleRestart}
        />
      );
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen flex flex-col">
      {/* Navigation Menu */}
      {/* Hide standard nav in Practice Mode to emphasize separation, or keep it for consistency. 
          The requirement 'separate page' often implies a full focus mode. 
          We'll hide the main nav in PRACTICE mode to make it feel like a modal/separate context.
      */}
      {mode !== 'PRACTICE' && (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-gray-900">CA Guide</span>
                </div>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                  <button
                    onClick={() => setMode('EXAM')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      mode === 'EXAM'
                        ? 'border-ca-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Exam Simulator
                  </button>
                  <button
                    onClick={() => setMode('CLASSES')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      mode === 'CLASSES'
                        ? 'border-ca-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    CA Classes
                  </button>
                </div>
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <Languages size={16} className="text-gray-500 ml-2" />
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-transparent text-sm font-medium text-gray-700 py-1 pr-2 outline-none cursor-pointer"
                  >
                    {Object.values(Language).map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile toggle */}
                <div className="flex items-center sm:hidden">
                  <button 
                    onClick={() => setMode(mode === 'EXAM' ? 'CLASSES' : 'EXAM')}
                    className="text-gray-500 hover:text-gray-700 font-medium text-xs ml-2"
                  >
                    {mode === 'EXAM' ? 'CLASSES' : 'EXAM'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;