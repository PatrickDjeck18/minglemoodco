import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, User, Calendar, BarChart3, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ExamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: any;
}

const ExamHistoryModal: React.FC<ExamHistoryModalProps> = ({ isOpen, onClose, attempt }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (isOpen && attempt) {
      loadQuestionDetails();
    }
  }, [isOpen, attempt]);

  const loadQuestionDetails = async () => {
    try {
      // Get questions that were used in this attempt
      const questionIds = attempt.question_order || [];
      
      if (questionIds.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const { data: questionsData, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (error) {
        console.error('Error loading questions:', error);
        setQuestions([]);
      } else {
        // Sort questions according to the order they appeared in the exam
        const sortedQuestions = questionIds.map(id => 
          questionsData.find(q => q.id === id)
        ).filter(Boolean);
        
        setQuestions(sortedQuestions);
      }
    } catch (error) {
      console.error('Error loading question details:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getShuffledOptions = (questionId: string) => {
    return attempt.shuffled_options?.[questionId] || {};
  };

  const getUserAnswer = (questionId: string) => {
    return attempt.answers?.[questionId] || '';
  };

  const isAnswerCorrect = (question: any) => {
    const userAnswer = getUserAnswer(question.id);
    if (question.question_type === 'multiple_choice') {
      return userAnswer === question.correct_answer;
    } else {
      // For open text, simple comparison (case insensitive)
      return userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    }
  };

  const getCorrectAnswerText = (question: any) => {
    if (question.question_type === 'multiple_choice') {
      const shuffledOptions = getShuffledOptions(question.id);
      if (Object.keys(shuffledOptions).length > 0) {
        return `${question.correct_answer}. ${shuffledOptions[question.correct_answer]}`;
      } else {
        return `${question.correct_answer}. ${question.options[question.correct_answer]}`;
      }
    } else {
      return question.correct_answer;
    }
  };

  const getUserAnswerText = (question: any) => {
    const userAnswer = getUserAnswer(question.id);
    if (!userAnswer) return 'Brak odpowiedzi';
    
    if (question.question_type === 'multiple_choice') {
      const shuffledOptions = getShuffledOptions(question.id);
      if (Object.keys(shuffledOptions).length > 0) {
        return `${userAnswer}. ${shuffledOptions[userAnswer]}`;
      } else {
        return `${userAnswer}. ${question.options[userAnswer]}`;
      }
    } else {
      return userAnswer;
    }
  };

  if (!isOpen) return null;

  const correctAnswers = questions.filter(q => isAnswerCorrect(q)).length;
  const totalQuestions = questions.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{attempt.exams?.title}</h2>
              <p className="text-sm text-gray-600 mt-1">Szczegóły egzaminu</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Exam Summary */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                attempt.passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {attempt.passed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-semibold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                {attempt.passed ? 'ZDANY' : 'NIEZDANY'}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Wynik</p>
              <p className="font-semibold text-gray-900">{attempt.score}%</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-2">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Data</p>
              <p className="font-semibold text-gray-900">
                {new Date(attempt.completed_at).toLocaleDateString('pl-PL')}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-2">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Próba</p>
              <p className="font-semibold text-gray-900">#{attempt.attempt_number}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-sm text-gray-600">Poprawne odpowiedzi:</span>
                  <span className="ml-2 font-semibold text-green-600">{correctAnswers}/{totalQuestions}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Próg zdawalności:</span>
                  <span className="ml-2 font-semibold text-gray-900">{attempt.exams?.passing_score}%</span>
                </div>
              </div>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  showAnswers 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {showAnswers ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ukryj odpowiedzi
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Pokaż odpowiedzi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Ładowanie pytań...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Brak dostępnych szczegółów pytań</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => {
                const isCorrect = isAnswerCorrect(question);
                const userAnswer = getUserAnswer(question.id);
                const shuffledOptions = getShuffledOptions(question.id);
                
                return (
                  <div key={question.id} className={`border rounded-lg p-6 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-sm mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium text-gray-900">Pytanie {index + 1}</h3>
                          <p className="text-sm text-gray-600">{question.points} punkt(y)</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Poprawne
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Niepoprawne
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-900 font-medium">{question.question_text}</p>
                    </div>

                    {question.question_type === 'multiple_choice' && (
                      <div className="space-y-2 mb-4">
                        {Object.entries(Object.keys(shuffledOptions).length > 0 ? shuffledOptions : question.options).map(([key, value]) => {
                          const isUserChoice = userAnswer === key;
                          const isCorrectChoice = question.correct_answer === key;
                          
                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectChoice && showAnswers
                                  ? 'border-green-500 bg-green-100'
                                  : isUserChoice && !isCorrectChoice && showAnswers
                                  ? 'border-red-500 bg-red-100'
                                  : isUserChoice
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900 mr-3">{key}.</span>
                                <span className="text-gray-700">{value}</span>
                                {showAnswers && isCorrectChoice && (
                                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                )}
                                {showAnswers && isUserChoice && !isCorrectChoice && (
                                  <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                )}
                                {isUserChoice && !showAnswers && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto"></div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.question_type === 'open_text' && (
                      <div className="space-y-3 mb-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-1">Twoja odpowiedź:</p>
                          <p className="text-blue-800">{userAnswer || 'Brak odpowiedzi'}</p>
                        </div>
                        {showAnswers && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-1">Poprawna odpowiedź:</p>
                            <p className="text-green-800">{question.correct_answer}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {showAnswers && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Twoja odpowiedź:</span>
                            <p className={`mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {getUserAnswerText(question)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Poprawna odpowiedź:</span>
                            <p className="mt-1 text-green-600">
                              {getCorrectAnswerText(question)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Egzamin ukończony: {new Date(attempt.completed_at).toLocaleString('pl-PL')}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamHistoryModal;