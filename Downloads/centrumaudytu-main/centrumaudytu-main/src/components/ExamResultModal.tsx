import React from 'react';
import { CheckCircle, XCircle, Trophy, RotateCcw, Home } from 'lucide-react';

interface ExamResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    score: number;
    passed: boolean;
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    passingScore: number;
  };
  examTitle: string;
}

const ExamResultModal: React.FC<ExamResultModalProps> = ({ 
  isOpen, 
  onClose, 
  result, 
  examTitle 
}) => {
  if (!isOpen) return null;

  const getScoreColor = () => {
    if (result.passed) return 'text-green-600';
    if (result.score >= result.passingScore * 0.8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    if (result.passed) return 'bg-green-50 border-green-200';
    if (result.score >= result.passingScore * 0.8) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`p-4 sm:p-6 text-center border-b border-gray-200 ${getScoreBackground()}`}>
          <div className="mb-4">
            {result.passed ? (
              <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto" />
            ) : (
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-600 mx-auto" />
            )}
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {result.passed ? 'Gratulacje!' : 'Egzamin niezaliczony'}
          </h2>
          
          <p className="text-sm sm:text-base text-gray-600 px-2">
            {result.passed 
              ? 'Pomyślnie zdałeś egzamin!' 
              : 'Nie osiągnąłeś wymaganego progu punktowego.'
            }
          </p>
        </div>

        {/* Results */}
        <div className="p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className={`text-3xl sm:text-4xl font-bold mb-2 ${getScoreColor()}`}>
              {result.score}%
            </div>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              Twój wynik z egzaminu "{examTitle}"
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm sm:text-base">
              <span className="text-gray-600">Próg zdawalności:</span>
              <span className="font-medium text-gray-900">{result.passingScore}%</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm sm:text-base">
              <span className="text-gray-600">Odpowiedziane pytania:</span>
              <span className="font-medium text-gray-900">
                {result.answeredQuestions}/{result.totalQuestions}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm sm:text-base">
              <span className="text-gray-600">Poprawne odpowiedzi:</span>
              <span className="font-medium text-gray-900">
                {result.correctAnswers}/{result.totalQuestions}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 text-sm sm:text-base">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium flex items-center ${
                result.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.passed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Zaliczony
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Niezaliczony
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 sm:space-y-4">
            {result.passed && (
              <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium text-xs sm:text-sm">
                  Otrzymałeś certyfikat ukończenia!
                </p>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base"
            >
              <Home className="h-4 w-4 mr-2 flex-shrink-0" />
              Powrót do panelu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResultModal;