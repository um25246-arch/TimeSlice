import React, { useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useData } from '@/contexts/DataContext';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Brain, Calendar, PlayCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { subjects, schedule, regenerateSchedule, studySessions } = useData();
  
  useEffect(() => {
    // Generate schedule on mount if subjects exist but no schedule
    if (subjects.length > 0 && schedule.length === 0) {
      regenerateSchedule();
    }
  }, [subjects.length]);

  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = schedule.filter(s => s.date === today);
  
  // Calculate total study time today
  const totalHoursToday = todaySchedule.reduce((sum, s) => sum + s.allocatedHours, 0);
  const totalPomodoros = todaySchedule.reduce((sum, s) => sum + s.pomodoroBlocks, 0);
  
  // Calculate completed sessions today
  const todaySessions = studySessions.filter(s => 
    new Date(s.createdAt).toDateString() === new Date().toDateString()
  );
  const completedMinutes = todaySessions.reduce((sum, s) => sum + s.actualDuration, 0);
  const progressPercent = totalHoursToday > 0 ? (completedMinutes / (totalHoursToday * 60)) * 100 : 0;

  // Upcoming exams
  const upcomingExams = subjects
    .map(s => ({
      ...s,
      daysUntil: Math.ceil((new Date(s.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter(s => s.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  const getMasteryColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-gradient-to-br from-primary to-accent p-4 rounded-full w-20 h-20 flex items-center justify-center">
                <BookOpen className="text-white" size={40} />
              </div>
              <CardTitle className="text-2xl">Welcome to TimeSlice</CardTitle>
              <CardDescription className="text-base mt-2">
                Plan → Study → Measure → Adapt
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Start by adding your subjects and setting up your study preferences.
                TimeSlice will help you allocate your time wisely and track your progress.
              </p>
              <Button asChild size="lg" className="mt-4">
                <Link to="/subjects">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Add Your First Subject
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Today's Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Progress
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Study Time</span>
                <span className="font-medium">{(completedMinutes / 60).toFixed(1)} / {totalHoursToday.toFixed(1)} hours</span>
              </div>
              <Progress value={Math.min(100, progressPercent)} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{totalPomodoros}</div>
                <div className="text-xs text-muted-foreground">Pomodoros Planned</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-accent">{todaySessions.length}</div>
                <div className="text-xs text-muted-foreground">Sessions Completed</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
                <div className="text-xs text-muted-foreground">Active Subjects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Study Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Study Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No study sessions scheduled for today.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link to="/schedule">View Full Schedule</Link>
                  </Button>
                </div>
              ) : (
                todaySchedule.map(entry => {
                  const subject = subjects.find(s => s.id === entry.subjectId);
                  if (!subject) return null;
                  
                  return (
                    <div key={entry.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{subject.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{entry.reasoning}</p>
                        </div>
                        <Badge variant="secondary">{entry.allocatedHours}h</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <PlayCircle className="h-3 w-3" />
                          {entry.pomodoroBlocks} pomodoros
                        </span>
                        <span className={getMasteryColor(subject.masteryScore)}>
                          {subject.masteryScore.toFixed(0)}% mastery
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              
              {todaySchedule.length > 0 && (
                <Button asChild className="w-full mt-4">
                  <Link to="/timer">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Study Session
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming exams scheduled.</p>
                </div>
              ) : (
                upcomingExams.map(exam => (
                  <div key={exam.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{exam.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(exam.examDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge variant={exam.daysUntil <= 7 ? 'destructive' : 'secondary'}>
                        {exam.daysUntil}d
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className={getMasteryColor(exam.masteryScore)}>
                          {exam.masteryScore.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={exam.masteryScore} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Subject Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{subject.name}</h4>
                      <span className={`text-sm font-medium ${getMasteryColor(subject.masteryScore)}`}>
                        {subject.masteryScore.toFixed(0)}% mastery
                      </span>
                    </div>
                    <Progress value={subject.masteryScore} className="h-2" />
                  </div>
                  <Badge variant="outline">
                    Weight: {subject.examWeight}/10
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
