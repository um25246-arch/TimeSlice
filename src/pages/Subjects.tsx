import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, BookOpen, Calendar, Weight, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { extractSyllabusTopics } from '@/lib/scheduling';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const Subjects = () => {
  const { subjects, addSubject, deleteSubject, updateSubject, setDailyStudyHours, dailyStudyHours, regenerateSchedule } = useData();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    examDate: '',
    examWeight: '5',
    difficulty: '3',
    syllabusText: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.examDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in subject name and exam date.",
        variant: "destructive",
      });
      return;
    }

    // Extract syllabus topics if provided (for toast message)
    const syllabusTopics = formData.syllabusText 
      ? extractSyllabusTopics(formData.syllabusText)
      : [];

    addSubject({
      name: formData.name,
      examDate: formData.examDate,
      examWeight: parseInt(formData.examWeight),
      difficulty: parseInt(formData.difficulty),
      syllabusText: formData.syllabusText || undefined,
    });

    toast({
      title: "Subject added!",
      description: syllabusTopics.length > 0 
        ? `${formData.name} added with ${syllabusTopics.length} topics extracted.`
        : `${formData.name} added successfully.`,
    });

    setFormData({
      name: '',
      examDate: '',
      examWeight: '5',
      difficulty: '3',
      syllabusText: '',
    });
    setIsAdding(false);

    // Regenerate schedule after adding subject
    setTimeout(() => regenerateSchedule(), 100);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete ${name}? This will remove all associated data.`)) {
      deleteSubject(id);
      toast({
        title: "Subject deleted",
        description: `${name} has been removed.`,
      });
      regenerateSchedule();
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 70) return 'bg-green-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-semibold">Subjects</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Study Settings</CardTitle>
            <CardDescription>Configure your daily study capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="dailyHours" className="min-w-fit">Daily Study Hours:</Label>
              <Input
                id="dailyHours"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={dailyStudyHours}
                onChange={(e) => {
                  setDailyStudyHours(parseFloat(e.target.value));
                  regenerateSchedule();
                }}
                className="max-w-32"
              />
              <span className="text-sm text-muted-foreground">hours per day</span>
            </div>
          </CardContent>
        </Card>

        {/* Add Subject Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Subject</CardTitle>
              <CardDescription>Enter subject details and optionally paste syllabus content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Subject Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Data Structures"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="examDate">Exam Date *</Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={formData.examDate}
                      onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="examWeight">Exam Weight (1-10)</Label>
                    <Input
                      id="examWeight"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.examWeight}
                      onChange={(e) => setFormData({ ...formData, examWeight: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">How important is this exam?</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                    <Input
                      id="difficulty"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">How challenging is this subject?</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="syllabusText">Syllabus Content (Optional)</Label>
                  <Textarea
                    id="syllabusText"
                    value={formData.syllabusText}
                    onChange={(e) => setFormData({ ...formData, syllabusText: e.target.value })}
                    placeholder="Paste syllabus text here... Topics will be extracted automatically from headings and bullet points."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    TimeSlice will extract topics from headings, bullets, and numbered lists.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add Subject Button */}
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add New Subject
          </Button>
        )}

        {/* Subjects List */}
        <div className="space-y-4">
          {subjects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
                <p className="text-muted-foreground">Add your first subject to get started with study planning.</p>
              </CardContent>
            </Card>
          ) : (
            subjects.map(subject => {
              const daysUntil = Math.ceil((new Date(subject.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const coveragePercent = subject.syllabusTopics.length > 0 
                ? (subject.topicsCovered / subject.syllabusTopics.length) * 100 
                : 0;
              
              return (
                <Card key={subject.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{subject.name}</CardTitle>
                        <CardDescription className="mt-2 flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(subject.examDate).toLocaleDateString()} ({daysUntil}d)
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="h-3 w-3" />
                            Weight: {subject.examWeight}/10
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Difficulty: {subject.difficulty}/5
                          </span>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subject.id, subject.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Mastery Level</span>
                          <span className="font-medium">{subject.masteryScore.toFixed(0)}%</span>
                        </div>
                        <Progress value={subject.masteryScore} className="h-2" />
                      </div>
                      
                      {subject.syllabusTopics.length > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Syllabus Coverage</span>
                            <span className="font-medium">
                              {subject.topicsCovered}/{subject.syllabusTopics.length} topics
                            </span>
                          </div>
                          <Progress value={coveragePercent} className="h-2" />
                        </div>
                      )}
                    </div>

                    {subject.syllabusTopics.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Extracted Topics ({subject.syllabusTopics.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {subject.syllabusTopics.slice(0, 10).map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {subject.syllabusTopics.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{subject.syllabusTopics.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Subjects;
