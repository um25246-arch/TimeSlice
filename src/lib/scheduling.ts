import { Subject, StudySession, ScheduleEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * TOPIC EXTRACTION PIPELINE
 * Extracts high-level topics from syllabus text using simple NLP heuristics
 * Used ONLY for estimating syllabus breadth, NOT for predicting exam content
 */
export function extractSyllabusTopics(syllabusText: string): string[] {
  if (!syllabusText) return [];
  
  const topics: string[] = [];
  const lines = syllabusText.split('\n');
  
  // Extract topics from:
  // - Lines starting with numbers (1., 2., etc.)
  // - Lines starting with bullets (-, *, •)
  // - Lines in ALL CAPS or Title Case (likely headings)
  // - Lines after keywords like "Chapter", "Unit", "Module", "Topic"
  
  const headingKeywords = /^(chapter|unit|module|topic|section|week|lesson)\s+\d+/i;
  const bulletPattern = /^[\s]*[-*•]\s+(.+)/;
  const numberedPattern = /^[\s]*\d+[\.)]\s+(.+)/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) return;
    
    // Check for heading keywords
    if (headingKeywords.test(trimmed)) {
      topics.push(trimmed);
      return;
    }
    
    // Check for bullets
    const bulletMatch = trimmed.match(bulletPattern);
    if (bulletMatch) {
      topics.push(bulletMatch[1].trim());
      return;
    }
    
    // Check for numbered lists
    const numberedMatch = trimmed.match(numberedPattern);
    if (numberedMatch) {
      topics.push(numberedMatch[1].trim());
      return;
    }
    
    // Check for all caps or title case (likely headings)
    if (trimmed.length < 60 && (
      trimmed === trimmed.toUpperCase() ||
      (trimmed[0] === trimmed[0].toUpperCase() && trimmed.includes(' '))
    )) {
      topics.push(trimmed);
    }
  });
  
  console.log(`Extracted ${topics.length} topics from syllabus`);
  return topics;
}

/**
 * STUDY HOUR ALLOCATION LOGIC
 * Prioritizes subjects based on:
 * 1. Low mastery scores (needs more work)
 * 2. Large uncovered syllabus proportion (more content to cover)
 * 3. High exam weight (more important)
 * 4. Near exam dates (more urgent)
 * 5. Missed/incomplete planned study sessions (needs catch-up)
 */
export function calculateSubjectPriority(
  subject: Subject,
  studySessions: StudySession[],
  daysUntilExam: number
): { priority: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let priority = 0;
  
  // Factor 1: Low mastery (0-40 points)
  const masteryFactor = Math.max(0, 100 - subject.masteryScore) * 0.4;
  priority += masteryFactor;
  if (subject.masteryScore < 50) {
    reasoning.push(`Low mastery (${subject.masteryScore.toFixed(0)}%)`);
  }
  
  // Factor 2: Syllabus coverage (0-30 points)
  const totalTopics = subject.syllabusTopics.length || 1;
  const coveragePercent = (subject.topicsCovered / totalTopics) * 100;
  const coverageFactor = Math.max(0, 100 - coveragePercent) * 0.3;
  priority += coverageFactor;
  if (coveragePercent < 60) {
    reasoning.push(`${coveragePercent.toFixed(0)}% syllabus covered`);
  }
  
  // Factor 3: Exam weight (0-20 points)
  const weightFactor = (subject.examWeight / 10) * 20;
  priority += weightFactor;
  if (subject.examWeight >= 7) {
    reasoning.push(`High exam weight (${subject.examWeight}/10)`);
  }
  
  // Factor 4: Time urgency (0-30 points)
  const urgencyFactor = Math.max(0, 30 - daysUntilExam) * 1.0;
  priority += Math.min(30, urgencyFactor);
  if (daysUntilExam <= 7) {
    reasoning.push(`Exam in ${daysUntilExam} days`);
  }
  
  // Factor 5: Study session completion rate (0-20 points)
  const recentSessions = studySessions.filter(s => 
    s.subjectId === subject.id &&
    new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  if (recentSessions.length > 0) {
    const completionRate = recentSessions.reduce((sum, s) => 
      sum + (s.actualDuration / s.plannedDuration), 0) / recentSessions.length;
    
    // Penalize under-studied subjects
    if (completionRate < 0.7) {
      const catchUpFactor = (1 - completionRate) * 20;
      priority += catchUpFactor;
      reasoning.push(`Behind schedule (${(completionRate * 100).toFixed(0)}% completion)`);
    }
  }
  
  // Factor 6: Self-rated difficulty (0-15 points)
  const difficultyFactor = (subject.difficulty / 5) * 15;
  priority += difficultyFactor;
  if (subject.difficulty >= 4) {
    reasoning.push(`High difficulty (${subject.difficulty}/5)`);
  }
  
  return { priority, reasoning };
}

/**
 * SCHEDULE GENERATION ENGINE
 * Generates day-by-day schedule for next 14 days
 * Distributes study hours based on priority scores
 */
export function generateSchedule(
  subjects: Subject[],
  studySessions: StudySession[],
  dailyStudyHours: number,
  pomodoroSettings: { focusDuration: number }
): ScheduleEntry[] {
  if (subjects.length === 0) return [];
  
  console.log('=== SCHEDULE GENERATION START ===');
  console.log('Daily study hours:', dailyStudyHours);
  console.log('Subjects count:', subjects.length);
  
  const schedule: ScheduleEntry[] = [];
  const today = new Date();
  const daysToSchedule = 14;
  
  // Calculate priorities for all subjects
  const subjectPriorities = subjects.map(subject => {
    const examDate = new Date(subject.examDate);
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const { priority, reasoning } = calculateSubjectPriority(subject, studySessions, daysUntilExam);
    
    console.log(`Subject: ${subject.name}, Priority: ${priority.toFixed(2)}, Reasoning:`, reasoning);
    
    return {
      subject,
      priority,
      reasoning: reasoning.join('; '),
      daysUntilExam,
    };
  });
  
  // Sort by priority (descending)
  subjectPriorities.sort((a, b) => b.priority - a.priority);
  
  // Generate schedule for each day
  for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    let remainingHours = dailyStudyHours;
    const dailyAllocations: ScheduleEntry[] = [];
    
    // Allocate hours based on priority
    const totalPriority = subjectPriorities.reduce((sum, sp) => {
      // Don't schedule subjects past their exam date
      if (sp.daysUntilExam - dayOffset < 0) return sum;
      return sum + sp.priority;
    }, 0);
    
    subjectPriorities.forEach(sp => {
      // Skip subjects past their exam date
      if (sp.daysUntilExam - dayOffset < 0) return;
      
      // Allocate proportional to priority
      const allocatedHours = totalPriority > 0 
        ? (sp.priority / totalPriority) * dailyStudyHours
        : dailyStudyHours / subjectPriorities.length;
      
      // Minimum 0.5 hours, maximum remaining hours
      const finalHours = Math.max(0.5, Math.min(allocatedHours, remainingHours));
      
      if (finalHours > 0) {
        const pomodoroBlocks = Math.ceil((finalHours * 60) / pomodoroSettings.focusDuration);
        
        dailyAllocations.push({
          id: uuidv4(),
          date: dateStr,
          subjectId: sp.subject.id,
          allocatedHours: parseFloat(finalHours.toFixed(2)),
          pomodoroBlocks,
          priority: sp.priority,
          reasoning: sp.reasoning || 'Routine study session',
        });
        
        remainingHours -= finalHours;
      }
    });
    
    schedule.push(...dailyAllocations);
  }
  
  console.log('=== SCHEDULE GENERATION COMPLETE ===');
  console.log('Total entries:', schedule.length);
  
  return schedule;
}

/**
 * TIMER DATA FEEDBACK LOOP
 * Analyzes actual vs planned study time to inform next rebalancing
 */
export function analyzeStudyPatterns(
  subject: Subject,
  studySessions: StudySession[]
): {
  avgCompletionRate: number;
  totalPlanned: number;
  totalActual: number;
  needsCatchUp: boolean;
} {
  const subjectSessions = studySessions.filter(s => s.subjectId === subject.id);
  
  if (subjectSessions.length === 0) {
    return { avgCompletionRate: 1, totalPlanned: 0, totalActual: 0, needsCatchUp: false };
  }
  
  const totalPlanned = subjectSessions.reduce((sum, s) => sum + s.plannedDuration, 0);
  const totalActual = subjectSessions.reduce((sum, s) => sum + s.actualDuration, 0);
  const avgCompletionRate = totalActual / totalPlanned;
  const needsCatchUp = avgCompletionRate < 0.8;
  
  return { avgCompletionRate, totalPlanned, totalActual, needsCatchUp };
}
