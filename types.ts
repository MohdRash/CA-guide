export enum DifficultyLevel {
  FOUNDATION = 'Foundation',
  INTERMEDIATE = 'Intermediate',
  FINAL = 'Final',
}

export enum Subject {
  ACCOUNTING = 'Accounting',
  LAW = 'Corporate & Other Laws',
  TAXATION = 'Taxation',
  AUDITING = 'Auditing & Assurance',
  FINANCIAL_MANAGEMENT = 'Financial Management',
  IT_SM = 'EIS & SM',
  ADVANCED_ACCOUNTING = 'Advanced Accounting',
}

export enum LearningStyle {
  CONCEPTUAL = 'Simplify for Beginners (Conceptual)',
  EXAM_FOCUSED = 'Exam Oriented (High Scoring)',
  IN_DEPTH = 'Master Class (In-Depth)',
}

export enum Language {
  ENGLISH = 'English',
  MALAYALAM = 'Malayalam',
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ExamConfig {
  subject: Subject;
  level: DifficultyLevel;
  questionCount: number;
  durationMinutes: number;
  topic?: string; // Optional topic for specific quizzes
  language: Language;
}

export interface ExamState {
  status: 'idle' | 'loading' | 'active' | 'finished' | 'error';
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, number>; // QuestionIndex -> OptionIndex
  flagged: Record<number, boolean>; // QuestionIndex -> isFlagged
  startTime: number | null;
  timeRemaining: number; // in seconds
  score: number;
  error?: string;
}

export interface SetupProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
  language: Language;
}

export interface ExamSessionProps {
  state: ExamState;
  onAnswer: (questionIndex: number, optionIndex: number) => void;
  onFlag: (questionIndex: number) => void;
  onNavigate: (questionIndex: number) => void;
  onSubmit: () => void;
}

export interface ResultsProps {
  state: ExamState;
  config: ExamConfig;
  onRestart: () => void;
}

// Class / Lesson Types
export interface LessonSection {
  title: string;
  content: string;
}

export interface Lesson {
  topic: string;
  subject: string;
  level: string;
  sections: LessonSection[];
}