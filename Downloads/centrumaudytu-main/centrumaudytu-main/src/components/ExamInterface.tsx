import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'open_text';
  options?: Record<string, string>;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit?: number;
  max_attempts: number;
  questions_per_exam: number;
}

interface ExamInterfaceProps {
  exam: Exam;
  onComplete: (score: number, passed: boolean) => void;
  onCancel: () => void;
  userId: string;
}

export default function ExamInterface({ exam, onComplete, onCancel, userId }: ExamInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    loadExamQuestions();
    startExamAttempt();
  }, []);

  useEffect(() => {
    if (exam.time_limit && timeLeft !== null) {
      if (timeLeft <= 0) {
        submitExam();
        return;
      }

      const timer = setInterval(() => {
        setTimeLeft(prev => prev ? prev - 1 : 0);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, exam.time_limit]);

  const loadExamQuestions = async () => {
    try {
      const { data: allQuestions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('order_index');

      if (error) throw error;

      // Shuffle and limit questions
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, exam.questions_per_exam);
      
      setQuestions(selectedQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
    }
  };

  const startExamAttempt = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert({
          exam_id: exam.id,
          participant_id: userId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setAttemptId(data.id);
      
      if (exam.time_limit) {
        setTimeLeft(exam.time_limit * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error('Error starting exam attempt:', error);
    }
  };

  const submitExam = async () => {
    if (submitting || !attemptId) return;
    
    setSubmitting(true);

    try {
      // Load questions with correct answers for scoring
      const { data: questionsWithAnswers, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id);

      if (questionsError) {
        console.error('Error loading questions for scoring:', questionsError);
        throw questionsError;
      }

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;
      let correctAnswers = 0;
      let totalQuestions = questionsWithAnswers.length;

      questionsWithAnswers.forEach(question => {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        
        if (userAnswer) {
          if (question.question_type === 'multiple_choice') {
            // For multiple choice, check if answer matches correct_answer
            if (userAnswer === question.correct_answer) {
              earnedPoints += question.points;
              correctAnswers++;
            }
          } else if (question.question_type === 'open_text') {
            // For open text, simple comparison (case insensitive, trimmed)
            const userAnswerNormalized = userAnswer.toLowerCase().trim();
            const correctAnswerNormalized = question.correct_answer.toLowerCase().trim();
            if (userAnswerNormalized === correctAnswerNormalized) {
              earnedPoints += question.points;
              correctAnswers++;
            }
          }
        }
      });

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = score >= exam.passing_score;

      console.log('📊 Exam scoring results:', {
        totalQuestions,
        correctAnswers,
        totalPoints,
        earnedPoints,
        score,
        passingScore: exam.passing_score,
        passed,
        answers: Object.keys(answers).length
      });

      // Get current attempt number
      const { data: existingAttempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('attempt_number')
        .eq('exam_id', exam.id)
        .eq('participant_id', userId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = existingAttempts && existingAttempts.length > 0 
        ? existingAttempts[0].attempt_number + 1 
        : 1;

      // Store question order and shuffled options for review
      const questionOrder = questions.map(q => q.id);
      const shuffledOptions = {};
      questions.forEach(question => {
        if (question.question_type === 'multiple_choice' && question.options) {
          shuffledOptions[question.id] = question.options;
        }
      });

      // Update exam attempt
      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score,
          passed,
          answers,
          attempt_number: attemptNumber,
          question_order: questionOrder,
          shuffled_options: shuffledOptions
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Auto-generate certificate if passed
      if (passed) {
        try {
          console.log('🏆 Starting certificate generation:', { 
            participantId: userId, 
            examId: exam.id, 
            attemptId 
          });

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              participantId: userId,
              examId: exam.id,
              attemptId: attemptId
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('🎉 Certificate generated successfully:', result.certificateUrl);
          } else {
            const error = await response.text();
            console.error('❌ Certificate generation failed:', error);
          }
        } catch (certError) {
          console.error('❌ Certificate generation error:', certError);
          // Don't fail the exam submission if certificate generation fails
        }
      }

      // Call onComplete with detailed results
      onComplete({
        score,
        passed,
        totalQuestions,
        answeredQuestions: Object.keys(answers).length,
        correctAnswers,
        passingScore: exam.passing_score
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie egzaminu...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Nie znaleziono pytań dla tego egzaminu.</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">{exam.title}</h1>
          {timeLeft !== null && (
            <div className="flex items-center text-base sm:text-lg font-semibold">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              <span className={timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-gray-600">
          <span className="text-sm sm:text-base">Pytanie {currentQuestionIndex + 1} z {questions.length}</span>
        </p>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800 leading-relaxed">
          {currentQuestion.question_text}
        </h2>

        {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options && typeof currentQuestion.options === 'object' && 
             Object.entries(currentQuestion.options).map(([key, value]) => (
              <label key={key} className="flex items-start p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={key}
                  checked={answers[currentQuestion.id] === key}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="mr-3 h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{key}. {value}</span>
              </label>
            )) || []}
          </div>
        )}

        {currentQuestion.question_type === 'open_text' && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Wpisz swoją odpowiedź..."
            className="w-full p-3 sm:p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            rows={4}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
        <button
          onClick={onCancel}
          className="order-3 sm:order-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base transition-colors duration-200"
        >
          Anuluj
        </button>

        <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
          {currentQuestionIndex > 0 && (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base transition-colors duration-200"
            >
              Poprzednie
            </button>
          )}

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base transition-colors duration-200"
            >
              Następne
            </button>
          ) : (
            <button
              onClick={submitExam}
              disabled={submitting}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base transition-colors duration-200"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                  Zapisywanie...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  Zakończ egzamin
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}