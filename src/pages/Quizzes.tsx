import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Brain, CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateDiagnosticQuiz, generatePeriodicQuiz } from '@/lib/quizEngine';
import { Quiz, QuizQuestion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const Quizzes = () => {
  const { subjects, addQuizResult } = useData();
  const { toast } = useToast();
  
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const handleStartQuiz = (subjectId: string, type: 'diagnostic' | 'periodic') => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    const quiz = type === 'diagnostic' 
      ? generateDiagnosticQuiz(subject)
      : generatePeriodicQuiz(subject);
    
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    console.log('Quiz started:', quiz);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answerIndex,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (activeQuiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFinishQuiz = () => {
    if (!activeQuiz) return;
    
    let correct = 0;
    activeQuiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswer) {
        correct++;
      }
    });
    
    setQuizScore({ correct, total: activeQuiz.questions.length });
    setShowResults(true);
    
    // Save quiz result
    addQuizResult({
      quizId: activeQuiz.id,
      subjectId: activeQuiz.subjectId,
      totalQuestions: activeQuiz.questions.length,
      correctAnswers: correct,
    });
    
    const percentage = (correct / activeQuiz.questions.length) * 100;
    toast({
      title: "Quiz completed!",
      description: `You scored ${percentage.toFixed(0)}%. Your mastery level has been updated.`,
    });
    
    console.log('Quiz completed. Score:', correct, '/', activeQuiz.questions.length);
  };

  const handleCloseQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  if (activeQuiz && !showResults) {
    const question = activeQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100;
    
    return (
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Quiz in Progress</h1>
            <Badge>Question {currentQuestion + 1} of {activeQuiz.questions.length}</Badge>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <Progress value={progress} className="h-2" />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full p-4 text-left border rounded-lg transition-all hover:bg-muted/50 ${
                      selectedAnswers[currentQuestion] === index 
                        ? 'border-primary bg-primary/10 shadow-md' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[currentQuestion] === index 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-border'
                      }`}>
                        {selectedAnswers[currentQuestion] === index && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              <Button 
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestion] === undefined}
              >
                {currentQuestion === activeQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showResults && activeQuiz) {
    const percentage = (quizScore.correct / quizScore.total) * 100;
    const subject = subjects.find(s => s.id === activeQuiz.subjectId);
    
    return (
      <div className="flex flex-col h-full w-full">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-semibold">Quiz Results</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 p-6 rounded-full w-32 h-32 flex items-center justify-center ${
                  percentage >= 70 ? 'bg-green-100' : percentage >= 40 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className={`text-4xl font-bold ${
                    percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <CardTitle className="text-2xl">{subject?.name}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {quizScore.correct} out of {quizScore.total} correct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {activeQuiz.questions.map((q, i) => {
                    const userAnswer = selectedAnswers[i];
                    const isCorrect = userAnswer === q.correctAnswer;
                    
                    return (
                      <div key={i} className={`p-4 border rounded-lg ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium mb-2">Question {i + 1}</p>
                            <p className="text-sm">{q.question}</p>
                            {!isCorrect && (
                              <p className="text-sm mt-2 text-muted-foreground">
                                Correct answer: {q.options[q.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCloseQuiz} className="flex-1">
                    Back to Quizzes
                  </Button>
                  <Button onClick={() => handleStartQuiz(activeQuiz.subjectId, activeQuiz.type)} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background px-6 py-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-semibold">Quizzes</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mastery Assessments</CardTitle>
            <CardDescription>
              Take quizzes to measure and update your mastery levels. Diagnostic quizzes establish baseline knowledge, 
              while periodic quizzes track your progress over time.
            </CardDescription>
          </CardHeader>
        </Card>

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
              <p className="text-muted-foreground">Add subjects first to take quizzes.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {subjects.map(subject => {
              const masteryColor = subject.masteryScore >= 70 
                ? 'text-green-600' 
                : subject.masteryScore >= 40 
                ? 'text-yellow-600' 
                : 'text-red-600';
              
              return (
                <Card key={subject.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription className="mt-2">
                          Current mastery: <span className={`font-semibold ${masteryColor}`}>
                            {subject.masteryScore.toFixed(0)}%
                          </span>
                        </CardDescription>
                      </div>
                      <Brain className={masteryColor} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={subject.masteryScore} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handleStartQuiz(subject.id, 'diagnostic')}
                        variant="outline"
                        className="w-full"
                      >
                        <Brain className="mr-2 h-4 w-4" />
                        Diagnostic (10 Q)
                      </Button>
                      <Button 
                        onClick={() => handleStartQuiz(subject.id, 'periodic')}
                        className="w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Quick Check (5 Q)
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Quiz results automatically update your mastery level
                    </p>
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

export default Quizzes;
