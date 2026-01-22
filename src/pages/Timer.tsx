import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { Play, Pause, Square, RotateCcw, Clock, Coffee, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TimerMode = 'focus' | 'short-break' | 'long-break';

const Timer = () => {
  const { subjects, addStudySession, pomodoroSettings, setPomodoroSettings, schedule } = useData();
  const { toast } = useToast();
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(pomodoroSettings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState(pomodoroSettings);

  const today = new Date().toISOString().split('T')[0];
  const todaySchedule = schedule.filter(s => s.date === today);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (mode === 'focus') {
      setCompletedCycles(prev => prev + 1);
      setTotalFocusTime(prev => prev + pomodoroSettings.focusDuration);
      
      toast({
        title: "Focus session complete!",
        description: `Great work! Time for a ${completedCycles + 1 >= pomodoroSettings.cyclesBeforeLongBreak ? 'long' : 'short'} break.`,
      });
      
      // Switch to break
      const newMode: TimerMode = (completedCycles + 1) % pomodoroSettings.cyclesBeforeLongBreak === 0 
        ? 'long-break' 
        : 'short-break';
      setMode(newMode);
      setTimeLeft(newMode === 'long-break' ? pomodoroSettings.longBreak * 60 : pomodoroSettings.shortBreak * 60);
    } else {
      toast({
        title: "Break complete!",
        description: "Ready to focus again?",
      });
      
      // Switch to focus
      setMode('focus');
      setTimeLeft(pomodoroSettings.focusDuration * 60);
    }
  };

  const handleStart = () => {
    if (!selectedSubject && mode === 'focus') {
      toast({
        title: "Select a subject",
        description: "Please select which subject you'll be studying.",
        variant: "destructive",
      });
      return;
    }
    
    if (!sessionStartTime && mode === 'focus') {
      setSessionStartTime(new Date());
    }
    
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (mode === 'focus' && sessionStartTime && selectedSubject && totalFocusTime > 0) {
      // Save study session
      const scheduleEntry = todaySchedule.find(s => s.subjectId === selectedSubject);
      const plannedMinutes = scheduleEntry ? scheduleEntry.allocatedHours * 60 : totalFocusTime;
      
      addStudySession({
        subjectId: selectedSubject,
        startTime: sessionStartTime.toISOString(),
        endTime: new Date().toISOString(),
        plannedDuration: plannedMinutes,
        actualDuration: totalFocusTime,
        pomodorosCompleted: completedCycles,
        pomodorosPlanned: scheduleEntry?.pomodoroBlocks || completedCycles,
      });
      
      toast({
        title: "Session saved!",
        description: `${totalFocusTime} minutes logged for ${subjects.find(s => s.id === selectedSubject)?.name}.`,
      });
    }
    
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(pomodoroSettings.focusDuration * 60);
    setCompletedCycles(0);
    setSessionStartTime(null);
    setTotalFocusTime(0);
  };

  const handleReset = () => {
    setIsRunning(false);
    const duration = mode === 'focus' 
      ? pomodoroSettings.focusDuration 
      : mode === 'short-break' 
      ? pomodoroSettings.shortBreak 
      : pomodoroSettings.longBreak;
    setTimeLeft(duration * 60);
  };

  const handleSaveSettings = () => {
    setPomodoroSettings(settingsForm);
    setShowSettings(false);
    handleReset();
    toast({
      title: "Settings saved!",
      description: "Pomodoro settings updated successfully.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDuration = () => {
    return mode === 'focus' 
      ? pomodoroSettings.focusDuration * 60
      : mode === 'short-break'
      ? pomodoroSettings.shortBreak * 60
      : pomodoroSettings.longBreak * 60;
  };

  const progressPercent = ((getDuration() - timeLeft) / getDuration()) * 100;

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
        <SidebarTrigger />
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Study Timer</h1>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Pomodoro Settings</CardTitle>
              <CardDescription>Customize your focus and break durations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="focusDuration">Focus (min)</Label>
                  <Input
                    id="focusDuration"
                    type="number"
                    min="1"
                    max="90"
                    value={settingsForm.focusDuration}
                    onChange={(e) => setSettingsForm({ ...settingsForm, focusDuration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="shortBreak">Short Break (min)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    min="1"
                    max="30"
                    value={settingsForm.shortBreak}
                    onChange={(e) => setSettingsForm({ ...settingsForm, shortBreak: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="longBreak">Long Break (min)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min="1"
                    max="60"
                    value={settingsForm.longBreak}
                    onChange={(e) => setSettingsForm({ ...settingsForm, longBreak: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="cycles">Cycles Before Long Break</Label>
                  <Input
                    id="cycles"
                    type="number"
                    min="2"
                    max="8"
                    value={settingsForm.cyclesBeforeLongBreak}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cyclesBeforeLongBreak: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveSettings}>Save Settings</Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Timer Card */}
          <Card className={`${mode === 'focus' ? 'border-primary' : mode === 'short-break' ? 'border-accent' : 'border-purple-500'}`}>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {mode === 'focus' ? (
                  <>
                    <Clock className="h-6 w-6 text-primary" />
                    <Badge className="bg-primary">Focus Time</Badge>
                  </>
                ) : (
                  <>
                    <Coffee className="h-6 w-6 text-accent" />
                    <Badge className="bg-accent">{mode === 'short-break' ? 'Short Break' : 'Long Break'}</Badge>
                  </>
                )}
              </div>
              <CardTitle className="text-7xl font-bold tracking-tight">
                {formatTime(timeLeft)}
              </CardTitle>
              <Progress value={progressPercent} className="h-3 mt-4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'focus' && (
                <div>
                  <Label>Studying:</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-center gap-3">
                {!isRunning ? (
                  <Button size="lg" onClick={handleStart} className="min-w-32">
                    <Play className="mr-2 h-5 w-5" />
                    Start
                  </Button>
                ) : (
                  <Button size="lg" onClick={handlePause} variant="secondary" className="min-w-32">
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                )}
                
                <Button size="lg" onClick={handleReset} variant="outline">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Reset
                </Button>
                
                {sessionStartTime && (
                  <Button size="lg" onClick={handleStop} variant="destructive">
                    <Square className="mr-2 h-5 w-5" />
                    End Session
                  </Button>
                )}
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Completed: {completedCycles} pomodoros</span>
                  <span>•</span>
                  <span>Focus time: {totalFocusTime} min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          {todaySchedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Plan</CardTitle>
                <CardDescription>Scheduled study sessions for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {todaySchedule.map(entry => {
                  const subject = subjects.find(s => s.id === entry.subjectId);
                  if (!subject) return null;
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold">{subject.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{entry.reasoning}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary">{entry.allocatedHours}h</Badge>
                        <span className="text-xs text-muted-foreground">{entry.pomodoroBlocks} pomodoros</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Timer;
