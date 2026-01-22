import React, { createContext, useContext, useState, useEffect } from 'react';
import { Subject, StudySession, Quiz, QuizResult, ScheduleEntry } from '@/types';
import { generateSchedule, extractSyllabusTopics } from '@/lib/scheduling';
import { v4 as uuidv4 } from 'uuid';

interface DataContextType {
  subjects: Subject[];
  studySessions: StudySession[];
  quizzes: Quiz[];
  quizResults: QuizResult[];
  schedule: ScheduleEntry[];
  dailyStudyHours: number;
  pomodoroSettings: {
    focusDuration: number;
    shortBreak: number;
    longBreak: number;
    cyclesBeforeLongBreak: number;
  };
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'masteryScore' | 'syllabusTopics' | 'topicsCovered'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  setDailyStudyHours: (hours: number) => void;
  setPomodoroSettings: (settings: DataContextType['pomodoroSettings']) => void;
  addStudySession: (session: Omit<StudySession, 'id' | 'createdAt'>) => void;
  addQuizResult: (result: Omit<QuizResult, 'id' | 'completedAt'>) => void;
  regenerateSchedule: () => void;
  getSubjectById: (id: string) => Subject | undefined;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [dailyStudyHours, setDailyStudyHoursState] = useState(4);
  const [pomodoroSettings, setPomodoroSettingsState] = useState({
    focusDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    cyclesBeforeLongBreak: 4,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSubjects = localStorage.getItem('timeSlice_subjects');
    const savedSessions = localStorage.getItem('timeSlice_sessions');
    const savedQuizResults = localStorage.getItem('timeSlice_quizResults');
    const savedSchedule = localStorage.getItem('timeSlice_schedule');
    const savedDailyHours = localStorage.getItem('timeSlice_dailyHours');
    const savedPomodoro = localStorage.getItem('timeSlice_pomodoro');

    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedSessions) setStudySessions(JSON.parse(savedSessions));
    if (savedQuizResults) setQuizResults(JSON.parse(savedQuizResults));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedDailyHours) setDailyStudyHoursState(JSON.parse(savedDailyHours));
    if (savedPomodoro) setPomodoroSettingsState(JSON.parse(savedPomodoro));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('timeSlice_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('timeSlice_sessions', JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('timeSlice_quizResults', JSON.stringify(quizResults));
  }, [quizResults]);

  useEffect(() => {
    localStorage.setItem('timeSlice_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('timeSlice_dailyHours', JSON.stringify(dailyStudyHours));
  }, [dailyStudyHours]);

  useEffect(() => {
    localStorage.setItem('timeSlice_pomodoro', JSON.stringify(pomodoroSettings));
  }, [pomodoroSettings]);

  const addSubject = (subjectData: Omit<Subject, 'id' | 'createdAt' | 'masteryScore' | 'syllabusTopics' | 'topicsCovered'>) => {
    const syllabusTopics = subjectData.syllabusText 
      ? extractSyllabusTopics(subjectData.syllabusText)
      : [];
    const newSubject: Subject = {
      ...subjectData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      masteryScore: 0,
      syllabusTopics,
      topicsCovered: 0,
    };
    setSubjects([...subjects, newSubject]);
    console.log('Subject added:', newSubject);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
    console.log('Subject updated:', id, updates);
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
    setStudySessions(studySessions.filter(s => s.subjectId !== id));
    setQuizResults(quizResults.filter(q => q.subjectId !== id));
    console.log('Subject deleted:', id);
  };

  const addStudySession = (sessionData: Omit<StudySession, 'id' | 'createdAt'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setStudySessions([...studySessions, newSession]);
    console.log('Study session added:', newSession);
  };

  const addQuizResult = (resultData: Omit<QuizResult, 'id' | 'completedAt'>) => {
    const newResult: QuizResult = {
      ...resultData,
      id: uuidv4(),
      completedAt: new Date().toISOString(),
    };
    setQuizResults([...quizResults, newResult]);
    
    // Update mastery score
    const subject = subjects.find(s => s.id === resultData.subjectId);
    if (subject) {
      const percentage = (resultData.correctAnswers / resultData.totalQuestions) * 100;
      updateSubject(resultData.subjectId, { masteryScore: percentage });
    }
    console.log('Quiz result added:', newResult);
  };

  const regenerateSchedule = () => {
    console.log('Regenerating schedule with subjects:', subjects);
    const newSchedule = generateSchedule(subjects, studySessions, dailyStudyHours, pomodoroSettings);
    setSchedule(newSchedule);
    console.log('New schedule generated:', newSchedule);
  };

  const getSubjectById = (id: string) => {
    return subjects.find(s => s.id === id);
  };

  const setDailyStudyHours = (hours: number) => {
    setDailyStudyHoursState(hours);
    console.log('Daily study hours updated:', hours);
  };

  const setPomodoroSettings = (settings: DataContextType['pomodoroSettings']) => {
    setPomodoroSettingsState(settings);
    console.log('Pomodoro settings updated:', settings);
  };

  return (
    <DataContext.Provider value={{
      subjects,
      studySessions,
      quizzes,
      quizResults,
      schedule,
      dailyStudyHours,
      pomodoroSettings,
      addSubject,
      updateSubject,
      deleteSubject,
      setDailyStudyHours,
      setPomodoroSettings,
      addStudySession,
      addQuizResult,
      regenerateSchedule,
      getSubjectById,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
