import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, FileText, HelpCircle, Download, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  onQuestionsImported: () => void;
}

interface ParsedQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'open_text';
  options?: Record<string, string>;
  correct_answer: string;
  points: number;
  order_index: number;
}

const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({ 
  isOpen, 
  onClose, 
  examId,
  onQuestionsImported 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setParsedQuestions([]);
    setShowPreview(false);
    setError('');
    setSuccess('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setSuccess('');
      setParsedQuestions([]);
      setShowPreview(false);
    }
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Plik musi zawierać nagłówek i co najmniej jeden wiersz z pytaniem');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row['pytanie'] || !row['typ'] || !row['poprawna_odpowiedz']) {
        throw new Error(`Wiersz ${i + 1}: Brakuje wymaganych pól (pytanie, typ, poprawna_odpowiedz)`);
      }

      const questionType = row['typ'].toLowerCase();
      if (!['wielokrotny_wybor', 'otwarte'].includes(questionType)) {
        throw new Error(`Wiersz ${i + 1}: Nieprawidłowy typ pytania. Użyj: wielokrotny_wybor lub otwarte`);
      }

      let options: Record<string, string> | undefined;
      if (questionType === 'wielokrotny_wybor') {
        options = {};
        ['A', 'B', 'C', 'D'].forEach(letter => {
          const optionKey = `opcja_${letter}`;
          if (row[optionKey]) {
            options![letter] = row[optionKey];
          }
        });

        if (Object.keys(options).length < 2) {
          throw new Error(`Wiersz ${i + 1}: Pytanie wielokrotnego wyboru musi mieć co najmniej 2 opcje`);
        }

        // Validate correct answer exists in options
        if (!options[row['poprawna_odpowiedz']]) {
          throw new Error(`Wiersz ${i + 1}: Poprawna odpowiedź "${row['poprawna_odpowiedz']}" nie istnieje w opcjach`);
        }
      }

      questions.push({
        question_text: row['pytanie'],
        question_type: questionType === 'wielokrotny_wybor' ? 'multiple_choice' : 'open_text',
        options,
        correct_answer: row['poprawna_odpowiedz'],
        points: parseInt(row['punkty']) || 1,
        order_index: i
      });
    }

    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(item => item.replace(/^"|"$/g, ''));
  };

  const parseExcel = async (file: File): Promise<ParsedQuestion[]> => {
    // For Excel parsing, we'll use a simple approach
    // In a real application, you might want to use a library like xlsx
    throw new Error('Import Excel będzie dostępny wkrótce. Użyj formatu CSV.');
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      let questions: ParsedQuestion[];

      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        questions = parseCSV(text);
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        questions = await parseExcel(selectedFile);
      } else {
        throw new Error('Nieobsługiwany format pliku. Użyj CSV lub Excel.');
      }

      setParsedQuestions(questions);
      setShowPreview(true);
      setSuccess(`Znaleziono ${questions.length} pytań do importu`);
    } catch (error: any) {
      setError(error.message || 'Błąd podczas parsowania pliku');
      setParsedQuestions([]);
      setShowPreview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const questionsToInsert = parsedQuestions.map(question => ({
        exam_id: examId,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options || null,
        correct_answer: question.correct_answer,
        points: question.points,
        order_index: question.order_index
      }));

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (insertError) throw insertError;

      setSuccess(`Pomyślnie zaimportowano ${parsedQuestions.length} pytań!`);
      onQuestionsImported();
      
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Błąd podczas importu pytań');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `pytanie,typ,opcja_A,opcja_B,opcja_C,opcja_D,poprawna_odpowiedz,punkty
"Jakie jest główne zadanie BHP?",wielokrotny_wybor,"Zwiększanie zysków","Ochrona zdrowia pracowników","Kontrola jakości","Zarządzanie czasem",B,1
"Wymień trzy podstawowe zasady bezpieczeństwa",otwarte,"","","","","Prewencja, ochrona, reagowanie",2`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'szablon_pytania.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Import pytań</h2>
            <p className="text-sm text-gray-600 mt-1">Importuj pytania z pliku CSV lub Excel</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-blue-600 hover:text-blue-700 transition-colors duration-200 p-2 rounded-full hover:bg-blue-50"
              title="Pokaż poradnik"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Guide Section */}
          {showGuide && (
            <div className="mb-6 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Jak przygotować plik CSV / Excel do importu pytań?
              </h3>
              
              <div className="space-y-4 text-sm sm:text-base text-blue-800">
                <div>
                  <h4 className="font-semibold mb-2">📋 Wymagane kolumny:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>pytanie</strong> - treść pytania</li>
                    <li><strong>typ</strong> - "wielokrotny_wybor" lub "otwarte"</li>
                    <li><strong>poprawna_odpowiedz</strong> - poprawna odpowiedź (dla wielokrotnego wyboru: A, B, C, D)</li>
                    <li><strong>punkty</strong> - liczba punktów za pytanie (domyślnie 1)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🔤 Dla pytań wielokrotnego wyboru:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>opcja_A</strong> - treść opcji A</li>
                    <li><strong>opcja_B</strong> - treść opcji B</li>
                    <li><strong>opcja_C</strong> - treść opcji C (opcjonalna)</li>
                    <li><strong>opcja_D</strong> - treść opcji D (opcjonalna)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">💡 Wskazówki:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Pierwszy wiersz musi zawierać nagłówki kolumn</li>
                    <li>Używaj cudzysłowów dla tekstów zawierających przecinki</li>
                    <li>Kodowanie pliku: UTF-8</li>
                    <li>Minimum 2 opcje dla pytań wielokrotnego wyboru</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz szablon CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Błąd</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Sukces</h4>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz plik <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors duration-200">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Wybierz plik</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept=".csv,.xlsx,.xls"
                    />
                  </label>
                  <p className="pl-1">lub przeciągnij tutaj</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV, Excel do 10MB
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600 font-medium">
                    Wybrany plik: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {parsedQuestions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Podgląd pytań ({parsedQuestions.length})
                </h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Ukryj
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Pokaż
                    </>
                  )}
                </button>
              </div>

              {showPreview && (
                <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {parsedQuestions.slice(0, 5).map((question, index) => (
                      <div key={index} className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                            {index + 1}. {question.question_text}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            question.question_type === 'multiple_choice' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {question.question_type === 'multiple_choice' ? 'Wielokrotny wybór' : 'Otwarte'}
                          </span>
                        </div>
                        
                        {question.question_type === 'multiple_choice' && question.options && (
                          <div className="ml-4 space-y-1 text-sm">
                            {Object.entries(question.options).map(([key, value]) => (
                              <div key={key} className={`flex items-center ${
                                key === question.correct_answer ? 'text-green-600 font-medium' : 'text-gray-600'
                              }`}>
                                <span className="w-6">{key}.</span>
                                <span>{value}</span>
                                {key === question.correct_answer && (
                                  <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.question_type === 'open_text' && (
                          <div className="ml-4 text-sm">
                            <span className="text-gray-600">Poprawna odpowiedź: </span>
                            <span className="text-green-600 font-medium">{question.correct_answer}</span>
                          </div>
                        )}
                        
                        <div className="ml-4 text-xs text-gray-500 mt-2">
                          Punkty: {question.points}
                        </div>
                      </div>
                    ))}
                    
                    {parsedQuestions.length > 5 && (
                      <div className="p-3 sm:p-4 text-center text-sm text-gray-500">
                        ... i {parsedQuestions.length - 5} więcej pytań
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Anuluj
            </button>
            
            {selectedFile && parsedQuestions.length === 0 && (
              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Analizowanie...' : 'Analizuj plik'}
              </button>
            )}
            
            {parsedQuestions.length > 0 && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Importowanie...' : `Importuj ${parsedQuestions.length} pytań`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportQuestionsModal;