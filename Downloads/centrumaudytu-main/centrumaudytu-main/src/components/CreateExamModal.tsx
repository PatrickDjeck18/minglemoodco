import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, Users, UserPlus, Upload, HelpCircle, Download, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated: () => void;
  userEmail?: string;
  groups?: any[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'open_text';
  options: Record<string, string>;
  correct_answer: string;
  points: number;
  order_index: number;
}

const CreateExamModal: React.FC<CreateExamModalProps> = ({ 
  isOpen, 
  onClose, 
  onExamCreated,
  userEmail,
  groups = []
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  
  // Import questions states
  const [showImportSection, setShowImportSection] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [assignAfterCreation, setAssignAfterCreation] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'group' | 'individual'>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit: 60,
    max_attempts: 3,
    questions_per_exam: 10,
    certificate_template: {
      szkolenie: '',
      kompetencje: '',
      opisUkonczenia: 'pomyślnie ukończył szkolenie i zdał egzamin'
    }
  });
  const [questions, setQuestions] = useState<Question[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      loadParticipants();
    }
  }, [isOpen]);

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'participant')
        .order('email');

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError('');
      setImportSuccess('');
      setParsedQuestions([]);
      setShowPreview(false);
    }
  };

  const parseCSV = (text: string): Question[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Plik musi zawierać nagłówek i co najmniej jeden wiersz z pytaniem');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const questions: Question[] = [];

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
        id: `temp-${Date.now()}-${i}`,
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

  const handlePreview = async () => {
    if (!selectedFile) return;

    setImportLoading(true);
    setImportError('');

    try {
      let importedQuestions: Question[];

      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        importedQuestions = parseCSV(text);
      } else {
        throw new Error('Nieobsługiwany format pliku. Użyj CSV.');
      }

      setParsedQuestions(importedQuestions);
      setShowPreview(true);
      setImportSuccess(`Znaleziono ${importedQuestions.length} pytań do importu`);
    } catch (error: any) {
      setImportError(error.message || 'Błąd podczas parsowania pliku');
      setParsedQuestions([]);
      setShowPreview(false);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportQuestions = () => {
    if (parsedQuestions.length === 0) return;
    
    // Add imported questions to existing questions
    const newQuestions = parsedQuestions.map((q, index) => ({
      ...q,
      id: `imported-${Date.now()}-${index}`,
      order_index: questions.length + index + 1
    }));
    
    setQuestions([...questions, ...newQuestions]);
    setImportSuccess(`Zaimportowano ${parsedQuestions.length} pytań!`);
    
    // Reset import state
    setSelectedFile(null);
    setParsedQuestions([]);
    setShowPreview(false);
    setShowImportSection(false);
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

  const resetForm = () => {
    setExamData({
      title: '',
      description: '',
      passing_score: 70,
      time_limit: 60,
      max_attempts: 3,
      questions_per_exam: 10,
      certificate_template: {
        szkolenie: '',
        kompetencje: '',
        opisUkonczenia: 'pomyślnie ukończył szkolenie i zdał egzamin'
      }
    });
    setQuestions([]);
    setAssignAfterCreation(false);
    setAssignmentType('group');
    setSelectedGroup('');
    setSelectedParticipants([]);
    setError('');
    setShowImportSection(false);
    setSelectedFile(null);
    setParsedQuestions([]);
    setShowPreview(false);
    setShowGuide(false);
    setImportError('');
    setImportSuccess('');
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: '',
      question_type: 'multiple_choice',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: 'A',
      points: 1,
      order_index: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const updateQuestionOption = (questionIndex: number, optionKey: string, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = {
      ...updatedQuestions[questionIndex].options,
      [optionKey]: value
    };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Użytkownik nie jest zalogowany');
      }

      // Create exam
      const { data: examResult, error: examError } = await supabase
        .from('exams')
        .insert({
          title: examData.title,
          description: examData.description,
          passing_score: examData.passing_score,
          time_limit: examData.time_limit || null,
          max_attempts: examData.max_attempts,
          questions_per_exam: examData.questions_per_exam,
          created_by: user.id,
          certificate_template: examData.certificate_template
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create questions if any
      if (questions.length > 0) {
        const questionsToInsert = questions.map((question, index) => ({
          exam_id: examResult.id,
          question_text: question.question_text,
          question_type: question.question_type,
          options: question.question_type === 'multiple_choice' ? question.options : null,
          correct_answer: question.correct_answer,
          points: question.points,
          order_index: index + 1
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      // Handle assignment if requested
      if (assignAfterCreation) {
        if (assignmentType === 'group' && selectedGroup) {
          const { error: assignError } = await supabase
            .from('exam_assignments')
            .insert({
              exam_id: examResult.id,
              group_id: selectedGroup,
              assigned_by: user.id
            });

          if (assignError) console.error('Assignment error:', assignError);
        } else if (assignmentType === 'individual' && selectedParticipants.length > 0) {
          const assignments = selectedParticipants.map(participantId => ({
            exam_id: examResult.id,
            participant_id: participantId,
            assigned_by: user.id
          }));

          const { error: assignError } = await supabase
            .from('exam_assignments')
            .insert(assignments);

          if (assignError) console.error('Assignment error:', assignError);
        }
      }

      onExamCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating exam:', error);
      setError(error.message || 'Wystąpił błąd podczas tworzenia egzaminu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nowy egzamin</h2>
            <p className="text-sm text-gray-600 mt-1">Utwórz nowy egzamin z pytaniami</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Assignment Section */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Przypisanie egzaminu (opcjonalne)</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={assignAfterCreation}
                  onChange={(e) => setAssignAfterCreation(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-blue-900">Przypisz egzamin po utworzeniu</span>
              </label>
            </div>

            {assignAfterCreation && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ przypisania
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="group"
                        checked={assignmentType === 'group'}
                        onChange={(e) => setAssignmentType(e.target.value as 'group' | 'individual')}
                        className="mr-2"
                      />
                      <Users className="h-4 w-4 mr-1" />
                      Grupa
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={assignmentType === 'individual'}
                        onChange={(e) => setAssignmentType(e.target.value as 'group' | 'individual')}
                        className="mr-2"
                      />
                      <UserPlus className="h-4 w-4 mr-1" />
                      Indywidualni uczestnicy
                    </label>
                  </div>
                </div>

                {assignmentType === 'group' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wybierz grupę
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">-- Wybierz grupę --</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Show group members when group is selected */}
                    {selectedGroup && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h6 className="text-sm font-medium text-blue-900 mb-2">
                          Członkowie grupy "{groups.find(g => g.id === selectedGroup)?.name}":
                        </h6>
                        <GroupMembersList groupId={selectedGroup} />
                      </div>
                    )}
                  </div>
                )}

                {assignmentType === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wybierz uczestników
                    </label>
                    <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                      {participants.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Brak dostępnych uczestników
                        </div>
                      ) : (
                        <div className="p-2">
                          {participants.map((participant) => (
                            <label
                              key={participant.id}
                              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedParticipants.includes(participant.id)}
                                onChange={() => toggleParticipant(participant.id)}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {participant.first_name && participant.last_name
                                    ? `${participant.first_name} ${participant.last_name}`
                                    : participant.email
                                  }
                                </div>
                                <div className="text-xs text-gray-500">{participant.email}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Błąd</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tytuł egzaminu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="np. Egzamin z BHP"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis egzaminu
              </label>
              <textarea
                rows={3}
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Krótki opis egzaminu..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próg zdawalności (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={examData.passing_score}
                onChange={(e) => setExamData({ ...examData, passing_score: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit czasu (minuty)
              </label>
              <input
                type="number"
                min="1"
                value={examData.time_limit}
                onChange={(e) => setExamData({ ...examData, time_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="0 = bez limitu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksymalna liczba prób <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={examData.max_attempts}
                onChange={(e) => setExamData({ ...examData, max_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liczba pytań w egzaminie
              </label>
              <input
                type="number"
                min="1"
                value={examData.questions_per_exam}
                onChange={(e) => setExamData({ ...examData, questions_per_exam: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="0 = wszystkie pytania"
              />
            </div>
          </div>

          {/* Certificate Template */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-3">Szablon certyfikatu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa szkolenia
                </label>
                <input
                  type="text"
                  value={examData.certificate_template.szkolenie}
                  onChange={(e) => setExamData({
                    ...examData,
                    certificate_template: {
                      ...examData.certificate_template,
                      szkolenie: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Zostanie użyty tytuł egzaminu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kompetencje
                </label>
                <input
                  type="text"
                  value={examData.certificate_template.kompetencje}
                  onChange={(e) => setExamData({
                    ...examData,
                    certificate_template: {
                      ...examData.certificate_template,
                      kompetencje: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Kompetencje związane z szkoleniem"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis ukończenia
                </label>
                <input
                  type="text"
                  value={examData.certificate_template.opisUkonczenia}
                  onChange={(e) => setExamData({
                    ...examData,
                    certificate_template: {
                      ...examData.certificate_template,
                      opisUkonczenia: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Pytania ({questions.length})</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 text-sm"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import pytań
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj pytanie
                </button>
              </div>
            </div>

            {/* Import Section */}
            {showImportSection && (
              <div className="mb-6 p-4 sm:p-6 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base sm:text-lg font-semibold text-purple-900">Import pytań z pliku CSV</h4>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-purple-600 hover:text-purple-700 transition-colors duration-200 p-2 rounded-full hover:bg-purple-100"
                    title="Pokaż poradnik"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* Guide Section */}
                {showGuide && (
                  <div className="mb-6 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-base sm:text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <HelpCircle className="h-5 w-5 mr-2" />
                      Jak przygotować plik CSV do importu pytań?
                    </h5>
                    
                    <div className="space-y-4 text-sm sm:text-base text-blue-800">
                      <div>
                        <h6 className="font-semibold mb-2">📋 Przykład pliku CSV:</h6>
                        <div className="bg-white border border-blue-300 rounded-lg p-3 overflow-x-auto">
                          <table className="min-w-full text-xs sm:text-sm">
                            <thead>
                              <tr className="border-b border-blue-200">
                                <th className="text-left p-2 font-semibold">pytanie</th>
                                <th className="text-left p-2 font-semibold">typ</th>
                                <th className="text-left p-2 font-semibold">opcja_A</th>
                                <th className="text-left p-2 font-semibold">opcja_B</th>
                                <th className="text-left p-2 font-semibold">opcja_C</th>
                                <th className="text-left p-2 font-semibold">opcja_D</th>
                                <th className="text-left p-2 font-semibold">poprawna_odpowiedz</th>
                                <th className="text-left p-2 font-semibold">punkty</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-blue-100">
                                <td className="p-2">Jakie jest główne zadanie BHP?</td>
                                <td className="p-2">wielokrotny_wybor</td>
                                <td className="p-2">Zwiększanie zysków</td>
                                <td className="p-2">Ochrona zdrowia pracowników</td>
                                <td className="p-2">Kontrola jakości</td>
                                <td className="p-2">Zarządzanie czasem</td>
                                <td className="p-2 font-semibold text-green-700">B</td>
                                <td className="p-2">1</td>
                              </tr>
                              <tr>
                                <td className="p-2">Wymień trzy podstawowe zasady bezpieczeństwa</td>
                                <td className="p-2">otwarte</td>
                                <td className="p-2 text-gray-400">-</td>
                                <td className="p-2 text-gray-400">-</td>
                                <td className="p-2 text-gray-400">-</td>
                                <td className="p-2 text-gray-400">-</td>
                                <td className="p-2 font-semibold text-green-700">Prewencja, ochrona, reagowanie</td>
                                <td className="p-2">2</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h6 className="font-semibold mb-2">📝 Wymagane kolumny:</h6>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>pytanie</strong> - treść pytania</li>
                          <li><strong>typ</strong> - "wielokrotny_wybor" lub "otwarte"</li>
                          <li><strong>poprawna_odpowiedz</strong> - poprawna odpowiedź (dla wielokrotnego wyboru: A, B, C, D)</li>
                          <li><strong>punkty</strong> - liczba punktów za pytanie (domyślnie 1)</li>
                        </ul>
                      </div>

                      <div>
                        <h6 className="font-semibold mb-2">🔤 Dla pytań wielokrotnego wyboru:</h6>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>opcja_A</strong> - treść opcji A</li>
                          <li><strong>opcja_B</strong> - treść opcji B</li>
                          <li><strong>opcja_C</strong> - treść opcji C (opcjonalna)</li>
                          <li><strong>opcja_D</strong> - treść opcji D (opcjonalna)</li>
                        </ul>
                      </div>

                      <div>
                        <h6 className="font-semibold mb-2">💡 Wskazówki:</h6>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Pierwszy wiersz musi zawierać nagłówki kolumn</li>
                          <li>Używaj cudzysłowów dla tekstów zawierających przecinki</li>
                          <li>Kodowanie pliku: UTF-8</li>
                          <li>Minimum 2 opcje dla pytań wielokrotnego wyboru</li>
                          <li>Dla pytań otwartych pozostaw opcje puste</li>
                        </ul>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          type="button"
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
                {importError && (
                  <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-sm font-medium text-red-800">Błąd</h6>
                      <p className="text-sm text-red-700 mt-1">{importError}</p>
                    </div>
                  </div>
                )}

                {importSuccess && (
                  <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-sm font-medium text-green-800">Sukces</h6>
                      <p className="text-sm text-green-700 mt-1">{importSuccess}</p>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wybierz plik CSV <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors duration-200">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                          <span>Wybierz plik</span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={handleFileSelect}
                            accept=".csv"
                          />
                        </label>
                        <p className="pl-1">lub przeciągnij tutaj</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV do 10MB</p>
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
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h6 className="text-base font-semibold text-gray-900">
                        Podgląd pytań ({parsedQuestions.length})
                      </h6>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center px-3 py-2 text-sm text-purple-600 hover:text-purple-700 transition-colors duration-200"
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
                      <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                        <div className="divide-y divide-gray-200">
                          {parsedQuestions.slice(0, 3).map((question, index) => (
                            <div key={index} className="p-3 sm:p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h6 className="font-medium text-gray-900 text-sm sm:text-base">
                                  {index + 1}. {question.question_text}
                                </h6>
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
                          
                          {parsedQuestions.length > 3 && (
                            <div className="p-3 sm:p-4 text-center text-sm text-gray-500">
                              ... i {parsedQuestions.length - 3} więcej pytań
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedFile && parsedQuestions.length === 0 && (
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={importLoading}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed"
                    >
                      {importLoading ? 'Analizowanie...' : 'Analizuj plik'}
                    </button>
                  )}
                  
                  {parsedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleImportQuestions}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Dodaj {parsedQuestions.length} pytań do egzaminu
                    </button>
                  )}
                </div>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">Brak pytań. Dodaj pierwsze pytanie do egzaminu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Pytanie {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Treść pytania <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Wpisz treść pytania..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Typ pytania
                        </label>
                        <select
                          value={question.question_type}
                          onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="multiple_choice">Wielokrotny wybór</option>
                          <option value="open_text">Otwarte</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Punkty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {question.question_type === 'multiple_choice' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opcje odpowiedzi
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700 w-6">{key}:</span>
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateQuestionOption(index, key, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder={`Opcja ${key}`}
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Poprawna odpowiedź
                          </label>
                          <select
                            value={question.correct_answer}
                            onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-green-50 border-green-300"
                          >
                            {Object.keys(question.options).map(key => (
                              <option key={key} value={key}>{key} - {question.options[key]}</option>
                            ))}
                          </select>
                          <p className="text-xs text-green-600 mt-1">
                            Wybrana poprawna odpowiedź: {question.correct_answer} - {question.options[question.correct_answer]}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Poprawna odpowiedź <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Wpisz poprawną odpowiedź..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {loading ? 'Tworzenie...' : 'Utwórz egzamin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper component to show group members
const GroupMembersList: React.FC<{ groupId: string }> = ({ groupId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('group_id', groupId)
        .eq('role', 'participant')
        .order('email');

      if (!error) {
        setMembers(data || []);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-blue-700">Ładowanie członków...</div>;
  }

  if (members.length === 0) {
    return <div className="text-xs text-blue-700">Brak członków w tej grupie</div>;
  }

  return (
    <div className="text-xs text-blue-700">
      {members.slice(0, 3).map(member => (
        <div key={member.id}>
          • {member.first_name && member.last_name 
            ? `${member.first_name} ${member.last_name}` 
            : member.email}
        </div>
      ))}
      {members.length > 3 && (
        <div>... i {members.length - 3} więcej</div>
      )}
    </div>
  );
};

export default CreateExamModal;