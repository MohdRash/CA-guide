import React, { useState } from 'react';
import { ExamConfig, DifficultyLevel, Subject, Language } from '../types';
import { BookOpen, GraduationCap, Clock, CheckCircle2 } from 'lucide-react';

interface SetupScreenProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
  language: Language;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStartExam, isLoading, language }) => {
  const [subject, setSubject] = useState<Subject>(Subject.ACCOUNTING);
  const [level, setLevel] = useState<DifficultyLevel>(DifficultyLevel.FOUNDATION);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const handleStart = () => {
    // Estimate 1.5 minutes per question for a realistic simulation
    const durationMinutes = Math.ceil(questionCount * 1.5);
    onStartExam({ 
      subject, 
      level, 
      questionCount, 
      durationMinutes,
      language // Pass the current language preference
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="md:w-5/12 bg-ca-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <h1 className="text-2xl font-bold tracking-tight">CA Guide</h1>
            </div>
            <p className="text-ca-100 mb-8 leading-relaxed">
              Master your Chartered Accountancy exams with our AI-powered simulation engine. 
              Practice with high-quality, scenario-based questions tailored to your level.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-ca-400" size={20} />
                <span className="text-sm font-medium text-ca-50">Real-time Performance Analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-ca-400" size={20} />
                <span className="text-sm font-medium text-ca-50">Detailed Explanations</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-ca-400" size={20} />
                <span className="text-sm font-medium text-ca-50">Customizable Difficulty</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-ca-800 text-xs text-ca-300">
              Current Language: <span className="text-white font-medium">{language}</span>
            </div>
          </div>
          
          {/* Decorative Circle */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-ca-800 rounded-full opacity-50 z-0"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-7/12 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Configure Examination</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(DifficultyLevel).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      level === l 
                        ? 'border-ca-600 bg-ca-50 text-ca-700' 
                        : 'border-gray-200 hover:border-ca-300 text-gray-600'
                    }`}
                  >
                    <GraduationCap size={20} className={`mb-1 ${level === l ? 'text-ca-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-ca-500 focus:border-ca-500 outline-none transition-shadow"
              >
                {Object.values(Subject).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Questions</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-ca-600"
                />
                <span className="w-12 text-center font-bold text-ca-700">{questionCount}</span>
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500 gap-1">
                <Clock size={12} />
                <span>Estimated time: {Math.ceil(questionCount * 1.5)} minutes</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-ca-600 to-ca-500 hover:shadow-ca-500/25'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Exam ({language})...
                </span>
              ) : (
                `Start Examination (${language})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;