import { Quiz, QuizQuestion, Subject } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * DIAGNOSTIC QUIZ GENERATOR
 * Creates simple MCQ quizzes to estimate initial mastery
 * Uses mock questions - in production, would integrate with question bank
 */
export function generateDiagnosticQuiz(subject: Subject): Quiz {
  // Generate 10 diagnostic questions
  // In a real app, these would come from a question bank or be user-provided
  const questions: QuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
    id: uuidv4(),
    question: `${subject.name} - Question ${i + 1}: Which concept is most fundamental?`,
    options: [
      'Option A: First concept',
      'Option B: Second concept',
      'Option C: Third concept',
      'Option D: Fourth concept',
    ],
    correctAnswer: Math.floor(Math.random() * 4), // Random for mock
  }));

  return {
    id: uuidv4(),
    subjectId: subject.id,
    questions,
    type: 'diagnostic',
    createdAt: new Date().toISOString(),
  };
}

/**
 * PERIODIC QUIZ GENERATOR
 * Creates shorter quizzes for periodic mastery checks
 */
export function generatePeriodicQuiz(subject: Subject): Quiz {
  // Generate 5 periodic questions
  const questions: QuizQuestion[] = Array.from({ length: 5 }, (_, i) => ({
    id: uuidv4(),
    question: `${subject.name} - Review Question ${i + 1}: What is the key takeaway?`,
    options: [
      'Option A: First takeaway',
      'Option B: Second takeaway',
      'Option C: Third takeaway',
      'Option D: Fourth takeaway',
    ],
    correctAnswer: Math.floor(Math.random() * 4), // Random for mock
  }));

  return {
    id: uuidv4(),
    subjectId: subject.id,
    questions,
    type: 'periodic',
    createdAt: new Date().toISOString(),
  };
}

/**
 * MASTERY SCORE CALCULATOR
 * Converts quiz performance into 0-100 mastery estimate
 */
export function calculateMasteryScore(
  correctAnswers: number,
  totalQuestions: number
): number {
  return (correctAnswers / totalQuestions) * 100;
}
