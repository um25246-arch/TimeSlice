import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Calendar, RefreshCw, PlayCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const Schedule = () => {
  const { schedule, subjects, regenerateSchedule } = useData();

  // Group schedule by date
  const scheduleByDate = schedule.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof schedule>);

  const sortedDates = Object.keys(scheduleByDate).sort();
  const today = new Date().toISOString().split('T')[0];

  const handleRegenerate = () => {
    regenerateSchedule();
  };

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-semibold">Schedule</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No schedule yet</h3>
              <p className="text-muted-foreground mb-4">Add subjects first to generate your study schedule.</p>
              <Button asChild>
                <Link to="/subjects">Add Subjects</Link>
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
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Study Schedule</h1>
          <Button onClick={handleRegenerate} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Schedule
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>14-Day Study Plan</CardTitle>
            <CardDescription>
              AI-generated schedule based on exam dates, mastery levels, and syllabus coverage
            </CardDescription>
          </CardHeader>
        </Card>

        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Schedule generation pending</h3>
              <p className="text-muted-foreground mb-4">Click "Regenerate Schedule" to create your study plan.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(date => {
              const entries = scheduleByDate[date];
              const totalHours = entries.reduce((sum, e) => sum + e.allocatedHours, 0);
              const isToday = date === today;
              const isPast = date < today;
              
              return (
                <Card key={date} className={isToday ? 'border-primary shadow-lg' : isPast ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {isToday && <Badge className="bg-primary">Today</Badge>}
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {totalHours.toFixed(1)} hours total study time
                        </CardDescription>
                      </div>
                      {isToday && (
                        <Button asChild size="sm">
                          <Link to="/timer">
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Start Session
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {entries.map(entry => {
                        const subject = subjects.find(s => s.id === entry.subjectId);
                        if (!subject) return null;
                        
                        return (
                          <div key={entry.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold">{subject.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{entry.reasoning}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="secondary">{entry.allocatedHours}h</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {entry.pomodoroBlocks} pomodoros
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Priority: {entry.priority.toFixed(1)}</span>
                              <span>Mastery: {subject.masteryScore.toFixed(0)}%</span>
                              <span>Weight: {subject.examWeight}/10</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Schedule;
