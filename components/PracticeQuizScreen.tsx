import React from 'react';
import { ExamState } from '../types';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, X, BrainCircuit, HelpCircle } from 'lucide-react';

interface PracticeQuizScreenProps {
  state: ExamState;
  onAnswer: (questionIndex: number, optionIndex: number) => void;
  onNavigate: (questionIndex: number) => void;
  onSubmit: () => void;
  onExit: () => void;
  title?: string;
}

const PracticeQuizScreen: React.FC<PracticeQuizScreenProps> = ({
  state,
  onAnswer,
  onNavigate,
  onSubmit,
  onExit,
  title,
}) => {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const selectedOption = state.answers[state.currentQuestionIndex];
  const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
  const allAnswered = Object.keys(state.answers).length === state.questions.length;

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(state.answers).length;
    const totalCount = state.questions.length;
    const unanswered = totalCount - answeredCount;
    
    if (unanswered === 0) {
      onSubmit();
      return;
    }

    if(window.confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
      onSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 flex flex-col h-screen overflow-hidden font-sans">
      {/* Practice Header */}
      <header className="bg-white border-b border-violet-100 h-16 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 p-2 rounded-lg text-violet-600">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-sm md:text-base leading-tight">
              Practice Session
            </div>
            {title && (
              <div className="text-xs text-violet-600 font-medium truncate max-w-[200px] md:max-w-md">
                {title}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-violet-600 font-mono font-medium bg-violet-50 px-3 py-1.5 rounded-md">
            <Clock size={16} />
            {formatTime(state.timeRemaining)}
          </div>

          <button 
            onClick={onExit}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Exit Practice"
          >
            <X size={24} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Progress Bar */}
          <div className="h-1.5 bg-violet-100 w-full">
            <div 
              className="h-full bg-violet-500 transition-all duration-300 ease-out"
              style={{ width: `${((state.currentQuestionIndex + 1) / state.questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 flex justify-between items-end">
                <span className="text-sm font-bold text-violet-400 uppercase tracking-widest">
                  Question {state.currentQuestionIndex + 1} <span className="text-gray-300">/ {state.questions.length}</span>
                </span>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-6 md:p-10 mb-8">
                <h2 className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed mb-8">
                  {currentQuestion.text}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAnswer(state.currentQuestionIndex, idx)}
                      className={`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                        selectedOption === idx
                          ? 'border-violet-500 bg-violet-50 shadow-sm'
                          : 'border-transparent bg-gray-50 hover:bg-violet-50/50 hover:border-violet-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedOption === idx 
                          ? 'border-violet-500 bg-violet-500 text-white' 
                          : 'border-gray-300 text-gray-400 group-hover:border-violet-300 group-hover:text-violet-300'
                      }`}>
                        {selectedOption === idx ? <CheckCircle size={16} /> : <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}
                      </div>
                      <span className={`text-base md:text-lg ${selectedOption === idx ? 'text-violet-900 font-medium' : 'text-gray-700'}`}>
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => onNavigate(state.currentQuestionIndex - 1)}
                  disabled={state.currentQuestionIndex === 0}
                  className="flex items-center gap-2 text-gray-500 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-gray-500 font-medium px-4 py-2 transition-colors"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>
                
                {isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black shadow-lg shadow-violet-200 transition-all transform hover:-translate-y-0.5"
                  >
                    Finish Practice
                    <CheckCircle size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate(state.currentQuestionIndex + 1)}
                    className="flex items-center gap-2 bg-violet-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all transform hover:-translate-y-0.5"
                  >
                    Next Question
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PracticeQuizScreen;