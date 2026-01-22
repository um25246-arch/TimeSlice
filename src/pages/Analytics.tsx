import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { BarChart3, TrendingUp, TrendingDown, Clock, Target, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { analyzeStudyPatterns } from '@/lib/scheduling';

const Analytics = () => {
  const { subjects, studySessions, schedule } = useData();

  // Calculate overall stats
  const totalPlannedMinutes = studySessions.reduce((sum, s) => sum + s.plannedDuration, 0);
  const totalActualMinutes = studySessions.reduce((sum, s) => sum + s.actualDuration, 0);
  const overallCompletionRate = totalPlannedMinutes > 0 ? (totalActualMinutes / totalPlannedMinutes) * 100 : 0;
  const totalPomodoros = studySessions.reduce((sum, s) => sum + s.pomodorosCompleted, 0);

  // Analyze each subject
  const subjectAnalytics = subjects.map(subject => {
    const analysis = analyzeStudyPatterns(subject, studySessions);
    const subjectSessions = studySessions.filter(s => s.subjectId === subject.id);
    const recentSessions = subjectSessions.filter(s => 
      new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    return {
      subject,
      ...analysis,
      sessionCount: subjectSessions.length,
      recentSessionCount: recentSessions.length,
      avgSessionDuration: subjectSessions.length > 0 
        ? subjectSessions.reduce((sum, s) => sum + s.actualDuration, 0) / subjectSessions.length 
        : 0,
    };
  });

  // Sort by completion rate (lowest first - needs attention)
  subjectAnalytics.sort((a, b) => a.avgCompletionRate - b.avgCompletionRate);

  const getCompletionColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-600';
    if (rate >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionBadge = (rate: number) => {
    if (rate >= 0.9) return 'On Track';
    if (rate >= 0.7) return 'Needs Focus';
    return 'Behind Schedule';
  };

  if (subjects.length === 0 || studySessions.length === 0) {
    return (
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-semibold">Analytics</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No data yet</h3>
              <p className="text-muted-foreground">
                Start studying with the timer to see your analytics and study patterns.
              </p>
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
        <h1 className="text-2xl font-semibold">Analytics</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Overall Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalActualMinutes / 60).toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {studySessions.length} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getCompletionColor(overallCompletionRate / 100)}`}>
                {overallCompletionRate.toFixed(0)}%
              </div>
              <Progress value={overallCompletionRate} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pomodoros Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalPomodoros}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Focus sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studySessions.length > 0 ? (totalActualMinutes / studySessions.length).toFixed(0) : 0}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per study session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Planned vs actual study time analysis. Subjects below show completion rates and areas needing attention.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectAnalytics.map(analytics => {
              const completionRate = analytics.avgCompletionRate * 100;
              
              return (
                <div key={analytics.subject.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{analytics.subject.name}</h4>
                        <Badge 
                          variant={completionRate >= 90 ? 'default' : completionRate >= 70 ? 'secondary' : 'destructive'}
                        >
                          {getCompletionBadge(analytics.avgCompletionRate)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sessions:</span>
                          <span className="ml-2 font-medium">{analytics.sessionCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Planned:</span>
                          <span className="ml-2 font-medium">{(analytics.totalPlanned / 60).toFixed(1)}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual:</span>
                          <span className="ml-2 font-medium">{(analytics.totalActual / 60).toFixed(1)}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Session:</span>
                          <span className="ml-2 font-medium">{analytics.avgSessionDuration.toFixed(0)}m</span>
                        </div>
                      </div>
                    </div>
                    {analytics.needsCatchUp ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className={`font-medium ${getCompletionColor(analytics.avgCompletionRate)}`}>
                        {completionRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  {analytics.needsCatchUp && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Needs Catch-Up</p>
                        <p className="text-xs text-red-700 mt-1">
                          This subject is under-studied. The scheduler will automatically allocate more time in upcoming sessions.
                        </p>
                      </div>
                    </div>
                  )}

                  {analytics.recentSessionCount === 0 && analytics.sessionCount > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">No Recent Activity</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          No study sessions in the past 7 days. Consider reviewing your schedule.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overallCompletionRate < 70 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Low Overall Completion Rate</p>
                  <p className="text-xs text-red-700 mt-1">
                    You're completing less than 70% of planned study time. Consider adjusting your daily study hours 
                    or breaking sessions into shorter Pomodoro blocks.
                  </p>
                </div>
              </div>
            )}

            {overallCompletionRate >= 100 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Excellent Progress!</p>
                  <p className="text-xs text-green-700 mt-1">
                    You're consistently meeting or exceeding your study goals. Keep up the great work!
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900">Automatic Rebalancing</p>
              <p className="text-xs text-blue-700 mt-1">
                TimeSlice automatically adjusts your schedule every 3-5 days based on your actual study patterns. 
                Under-studied subjects get more time, while well-covered subjects can release time to others.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
