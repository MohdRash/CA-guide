import React, { useEffect } from 'react';
import { ExamState, Question } from '../types';
import { Flag, ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';

interface ExamScreenProps {
  state: ExamState;
  onAnswer: (questionIndex: number, optionIndex: number) => void;
  onFlag: (questionIndex: number) => void;
  onNavigate: (questionIndex: number) => void;
  onSubmit: () => void;
  title?: string; // Added optional title prop
}

const ExamScreen: React.FC<ExamScreenProps> = ({
  state,
  onAnswer,
  onFlag,
  onNavigate,
  onSubmit,
  title,
}) => {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const isFlagged = state.flagged[state.currentQuestionIndex];
  const selectedOption = state.answers[state.currentQuestionIndex];
  const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;
  const allAnswered = Object.keys(state.answers).length === state.questions.length;

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getQuestionStatusClass = (index: number) => {
    if (index === state.currentQuestionIndex) return 'ring-2 ring-ca-600 bg-white text-ca-700';
    if (state.flagged[index]) return 'bg-orange-100 text-orange-600 border-orange-200';
    if (state.answers[index] !== undefined) return 'bg-ca-50 text-ca-600 border-ca-200';
    return 'bg-white text-gray-500 border-gray-200';
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(state.answers).length;
    const totalCount = state.questions.length;
    const unanswered = totalCount - answeredCount;
    
    // Direct submit if all questions are answered
    if (unanswered === 0) {
      onSubmit();
      return;
    }

    const message = `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?`;
    if(window.confirm(message)) {
      onSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
        <div className="font-bold text-gray-800 text-lg truncate max-w-md">
          {title ? `Quiz: ${title}` : "CA Exam Simulator"}
        </div>
        
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${state.timeRemaining < 300 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
          <Clock size={20} />
          {formatTime(state.timeRemaining)}
        </div>

        <button 
          onClick={handleSubmit}
          className={`px-6 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 ${
            allAnswered 
              ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400 ring-offset-1' 
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {allAnswered && <CheckCircle size={18} />}
          Submit Exam
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-3xl mx-auto pb-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Question {state.currentQuestionIndex + 1} of {state.questions.length}
                </span>
                <button
                  onClick={() => onFlag(state.currentQuestionIndex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isFlagged 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Flag size={16} fill={isFlagged ? "currentColor" : "none"} />
                  {isFlagged ? 'Flagged for Review' : 'Flag for Review'}
                </button>
              </div>

              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed mb-8">
                {currentQuestion.text}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAnswer(state.currentQuestionIndex, idx)}
                    className={`w-full text-left p-5 rounded-xl border transition-all flex items-start gap-4 group ${
                      selectedOption === idx
                        ? 'border-ca-500 bg-ca-50 shadow-md ring-1 ring-ca-500'
                        : 'border-gray-200 bg-white hover:border-ca-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      selectedOption === idx ? 'border-ca-600 bg-ca-600' : 'border-gray-300 group-hover:border-ca-400'
                    }`}>
                      {selectedOption === idx && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-base ${selectedOption === idx ? 'text-ca-900 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <button
              onClick={() => onNavigate(state.currentQuestionIndex - 1)}
              disabled={state.currentQuestionIndex === 0}
              className="flex items-center gap-2 text-gray-600 hover:text-ca-700 disabled:opacity-30 disabled:hover:text-gray-600 font-medium px-4 py-2"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors"
              >
                Finish Exam
                <CheckCircle size={20} />
              </button>
            ) : (
              <button
                onClick={() => onNavigate(state.currentQuestionIndex + 1)}
                className="flex items-center gap-2 bg-ca-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-ca-700 shadow-sm transition-colors"
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </main>

        {/* Sidebar Question Palette */}
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col hidden md:flex flex-shrink-0">
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Question Palette</h3>
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-ca-500"></div> Answered
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div> Flagged
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-4 gap-3">
              {state.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(idx)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold border transition-all ${getQuestionStatusClass(idx)}`}
                >
                  {idx + 1}
                  {state.flagged[idx] && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-5 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-ca-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(Object.keys(state.answers).length / state.questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="mt-2 text-right text-xs font-semibold text-gray-700">
              {Object.keys(state.answers).length} / {state.questions.length} Answered
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamScreen;