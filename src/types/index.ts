export interface Subject {
  id: string;
  name: string;
  examDate: string;
  examWeight: number; // 1-10 scale
  difficulty: number; // 1-5 scale
  masteryScore: number; // 0-100 percentage
  syllabusTopics: string[];
  topicsCovered: number;
  syllabusText?: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  pomodorosCompleted: number;
  pomodorosPlanned: number;
  createdAt: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  questions: QuizQuestion[];
  type: 'diagnostic' | 'periodic';
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface QuizResult {
  id: string;
  quizId: string;
  subjectId: string;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

export interface ScheduleEntry {
  id: string;
  date: string;
  subjectId: string;
  allocatedHours: number;
  pomodoroBlocks: number;
  priority: number; // higher = more urgent
  reasoning: string; // explanation for allocation
}

export interface PomodoroSession {
  subjectId: string;
  startTime: Date;
  duration: number;
  type: 'focus' | 'short-break' | 'long-break';
}
