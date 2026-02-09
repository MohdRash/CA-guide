import React from 'react';
import { ExamState, ExamConfig } from '../types';
import { CheckCircle2, XCircle, RotateCcw, Award, AlertCircle } from 'lucide-react';

interface ResultsProps {
  state: ExamState;
  config: ExamConfig;
  onRestart: () => void;
}

const ResultsScreen: React.FC<ResultsProps> = ({ state, config, onRestart }) => {
  const totalQuestions = state.questions.length;
  const correctCount = state.score;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const isPass = percentage >= 50; // CA Standard usually 40% per subject, 50% agg, let's use 50% for single subject test.

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`p-8 text-white flex flex-col md:flex-row items-center justify-between ${isPass ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-red-600 to-pink-600'}`}>
            <div>
              <h1 className="text-3xl font-bold mb-2">{isPass ? 'Congratulations!' : 'Keep Practicing'}</h1>
              <p className="opacity-90">
                {isPass 
                  ? 'You have successfully cleared this simulation. Great preparation!' 
                  : 'You fell short of the passing criteria. Review your answers below.'}
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{percentage}%</div>
                <div className="text-sm opacity-80">Score</div>
              </div>
              <div className="h-12 w-px bg-white/30"></div>
              <div className="text-center">
                <div className="text-4xl font-bold">{correctCount}/{totalQuestions}</div>
                <div className="text-sm opacity-80">Correct</div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex items-center justify-between bg-white">
            <div className="flex gap-8">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Subject</div>
                <div className="font-medium text-gray-900">{config.subject}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Level</div>
                <div className="font-medium text-gray-900">{config.level}</div>
              </div>
            </div>
            <button
              onClick={onRestart}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-lg shadow-gray-200"
            >
              <RotateCcw size={18} />
              Take New Exam
            </button>
          </div>
        </div>

        {/* Detailed Review */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Award className="text-ca-600" />
            Detailed Performance Review
          </h2>
          
          <div className="space-y-6">
            {state.questions.map((question, index) => {
              const userAnswerIndex = state.answers[index];
              const isCorrect = userAnswerIndex === question.correctOptionIndex;
              const isSkipped = userAnswerIndex === undefined;

              return (
                <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : isSkipped ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-medium text-gray-800 mb-4">{question.text}</p>
                        
                        <div className="space-y-2">
                          {question.options.map((option, optIdx) => {
                            let optionClass = "border-gray-200 bg-white text-gray-600";
                            let icon = null;

                            if (optIdx === question.correctOptionIndex) {
                              optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                              icon = <CheckCircle2 size={16} className="text-emerald-600" />;
                            } else if (optIdx === userAnswerIndex) {
                              optionClass = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                              icon = <XCircle size={16} className="text-red-600" />;
                            }

                            return (
                              <div key={optIdx} className={`p-3 rounded-lg border text-sm flex items-center justify-between ${optionClass}`}>
                                <span>{option}</span>
                                {icon}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <AlertCircle size={20} className="text-ca-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Examiner's Note & Logic</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
