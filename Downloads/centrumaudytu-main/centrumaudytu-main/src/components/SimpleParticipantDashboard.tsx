import React, { useState } from 'react';
import { BookOpen, Clock, CheckCircle, XCircle, LogOut, Trophy, Download, Eye, Calendar, Award, FileText, BarChart3, Play, ExternalLink, Image, Headphones, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExamInterface from './ExamInterface';
import ExamResultModal from './ExamResultModal';
import ExamHistoryModal from './ExamHistoryModal';
import CertificateModal from './CertificateModal';
import MaterialViewerModal from './MaterialViewerModal';
import SettingsModal from './SettingsModal';

interface SimpleParticipantDashboardProps {
  user: { role: 'admin' | 'participant'; email: string };
  onLogout: () => void;
}

const SimpleParticipantDashboard: React.FC<SimpleParticipantDashboardProps> = ({ user, onLogout }) => {
  const [assignedExams, setAssignedExams] = useState([]);
  const [assignedMaterials, setAssignedMaterials] = useState([]);
  const [materialProgress, setMaterialProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('exams');
  const [attempts, setAttempts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load real data from Supabase
  React.useEffect(() => {
    loadUserData();
  }, []);

  // Auto-refresh data every 30 seconds to keep it current
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadUserData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartExam = (exam: any) => {
    setError('');
    setSelectedExam(exam);
  };

  const handleExamComplete = (result?: any) => {
    setSelectedExam(null);
    if (result) {
      setExamResult(result);
      setShowResult(true);
    }
    loadUserData(); // Reload data to show updated attempts
  };

  const handleExamCancel = () => {
    setSelectedExam(null);
  };

  const loadUserData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Get user's profile first to get group_id
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setError('Błąd ładowania profilu użytkownika');
          setLoading(false);
          return;
        }

        setUserProfile(userProfile);

        // Load assigned exams
        let orFilter = `participant_id.eq.${authUser.id}`;
        if (userProfile.group_id) {
          orFilter += `,group_id.eq.${userProfile.group_id}`;
        }
        
        const { data: assignedData, error: assignedError } = await supabase
          .from('exam_assignments')
          .select(`
            *,
            exams (*)
          `)
          .or(orFilter)
          .order('assigned_at', { ascending: false });
          
        if (assignedError) {
          console.error('❌ Error loading assigned exams:', assignedError);
          setError('Błąd ładowania przypisanych egzaminów');
          setAssignedExams([]);
        } else {
          setAssignedExams(assignedData || []);
        }

        // Load attempts for this user with exam details
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select(`
            *,
            exams (
              id,
              title,
              description,
              passing_score,
              time_limit,
              max_attempts
            )
          `)
          .eq('participant_id', authUser.id)
          .order('started_at', { ascending: false });

        if (!attemptsError && attemptsData) {
          setAttempts(attemptsData);
        } else if (attemptsError) {
          console.error('Error loading attempts:', attemptsError);
        }

        // Load certificates for this user
        const { data: certificatesData, error: certificatesError } = await supabase
          .from('certificates')
          .select(`
            *,
            exams (
              title
            )
          `)
          .eq('participant_id', authUser.id)
          .order('generated_at', { ascending: false });

        if (!certificatesError && certificatesData) {
          setCertificates(certificatesData);
        } else if (certificatesError) {
          console.error('Error loading certificates:', certificatesError);
        }

        // Load assigned materials
        let materialOrFilter = `participant_id.eq.${authUser.id}`;
        if (userProfile.group_id) {
          materialOrFilter += `,group_id.eq.${userProfile.group_id}`;
        }
        
        const { data: materialsData, error: materialsError } = await supabase
          .from('material_assignments')
          .select(`
            *,
            training_materials (*)
          `)
          .or(materialOrFilter)
          .order('assigned_at', { ascending: false });
          
        if (!materialsError && materialsData) {
          setAssignedMaterials(materialsData);
        } else if (materialsError) {
          console.error('Error loading assigned materials:', materialsError);
        }

        // Load material progress
        const { data: progressData, error: progressError } = await supabase
          .from('material_progress')
          .select(`
            *,
            training_materials (*)
          `)
          .eq('participant_id', authUser.id)
          .order('last_accessed_at', { ascending: false });

        if (!progressError && progressData) {
          setMaterialProgress(progressData);
        } else if (progressError) {
          console.error('Error loading material progress:', progressError);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Wystąpił błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialClick = async (material: any) => {
    try {
      // Update progress to 'in_progress' and last_accessed_at
      const { error } = await supabase
        .from('material_progress')
        .upsert({
          material_id: material.training_materials.id,
          participant_id: userProfile.id,
          status: 'in_progress',
          last_accessed_at: new Date().toISOString(),
          started_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating material progress:', error);
      }

      // Open material based on type
      if (material.training_materials.type === 'link') {
        window.open(material.training_materials.external_url, '_blank');
      } else {
        setSelectedMaterial(material.training_materials);
        setShowMaterialViewer(true);
      }
    } catch (error) {
      console.error('Error handling material click:', error);
    }
  };

  // Helper function to get completed attempts count for a specific exam
  const getCompletedAttemptsCount = (examId: string) => {
    return attempts.filter(attempt => 
      attempt.exam_id === examId && attempt.completed_at !== null
    ).length;
  };

  // Helper function to check if exam can be started
  const canStartExam = (exam: any) => {
    const completedAttempts = getCompletedAttemptsCount(exam.id);
    return completedAttempts < exam.max_attempts;
  };

  // Get exam statistics
  const passedAttempts = attempts.filter(attempt => attempt.passed && attempt.completed_at);
  const failedAttempts = attempts.filter(attempt => !attempt.passed && attempt.completed_at);
  const inProgressAttempts = attempts.filter(attempt => !attempt.completed_at);
  const availableExams = assignedExams.filter(assignment => canStartExam(assignment.exams));
  const completedExams = assignedExams.filter(assignment => {
    const examAttempts = attempts.filter(attempt => 
      attempt.exam_id === assignment.exams.id && attempt.completed_at
    );
    return examAttempts.some(attempt => attempt.passed);
  });

  // Get material statistics
  const completedMaterials = materialProgress.filter(progress => progress.status === 'completed');
  const inProgressMaterials = materialProgress.filter(progress => progress.status === 'in_progress');
  const notStartedMaterials = assignedMaterials.filter(assignment => {
    const progress = materialProgress.find(p => p.material_id === assignment.material_id);
    return !progress || progress.status === 'not_started';
  });

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'audio':
        return <Headphones className="h-4 w-4" />;
      case 'link':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleViewHistory = (attempt: any) => {
    setSelectedAttempt(attempt);
    setShowHistory(true);
  };

  const handleViewCertificate = (attempt: any) => {
    // Try to find certificate from database first
    const dbCertificate = certificates.find(cert => cert.attempt_id === attempt.id);
    
    if (dbCertificate) {
      setSelectedCertificate({
        examTitle: dbCertificate.certificate_data.SZKOLENIE || attempt.exams.title,
        participantName: dbCertificate.certificate_data.IMIE_NAZWISKO,
        completionDate: attempt.completed_at,
        score: attempt.score,
        certificateId: dbCertificate.id,
        kompetencje: dbCertificate.certificate_data.KOMPETENCJE,
        opisUkonczenia: dbCertificate.certificate_data.OPIS_UKONCZENIA,
        pdfUrl: dbCertificate.pdf_url
      });
    } else {
      // Fallback to generated certificate data
      setSelectedCertificate({
        examTitle: attempt.exams.title,
        participantName: userProfile?.first_name && userProfile?.last_name 
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : user.email,
        completionDate: attempt.completed_at,
        score: attempt.score,
        certificateId: `CERT-${attempt.id.slice(0, 8).toUpperCase()}`
      });
    }
    setShowCertificate(true);
  };

  // Show exam interface if exam is selected
  if (selectedExam && userProfile) {
    return (
      <ExamInterface
        exam={selectedExam}
        onComplete={handleExamComplete}
        onCancel={handleExamCancel}
        userId={userProfile.id}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/Logo Centrum Audytu New.svg" 
                alt="Logo Centrum Audytu" 
                className="h-10 w-auto mr-4"
              />
              <h1 className="text-xl font-semibold text-gray-900">Panel Kursanta</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Witaj, {userProfile?.first_name || user.email}
              </span>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Ustawienia"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Błąd</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Dostępne egzaminy</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{availableExams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Zdane</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{passedAttempts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Niezdane</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{failedAttempts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Certyfikaty</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{passedAttempts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Materiały</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{assignedMaterials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">W trakcie</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{inProgressMaterials.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('exams')}
                className={`py-3 sm:py-4 px-2 sm:px-1 mr-4 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === 'exams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Dostępne egzaminy ({availableExams.length})
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`py-3 sm:py-4 px-2 sm:px-1 mr-4 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === 'materials'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Materiały ({assignedMaterials.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-3 sm:py-4 px-2 sm:px-1 mr-4 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Zdane egzaminy ({completedExams.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 sm:py-4 px-2 sm:px-1 mr-4 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Historia egzaminów ({attempts.filter(a => a.completed_at).length})
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === 'certificates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Award className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                Certyfikaty ({certificates.length})
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <div>
                {availableExams.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Brak dostępnych egzaminów</h3>
                    <p className="text-sm sm:text-base text-gray-500 px-4">Wszystkie przydzielone egzaminy zostały ukończone lub wyczerpano liczbę prób.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {availableExams.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-0">{assignment.exams.title}</h3>
                              <span className="self-start sm:ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Dostępny
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 mb-4">{assignment.exams.description}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div className="flex items-center text-gray-500">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Próg: {assignment.exams.passing_score}%
                              </div>
                              {assignment.exams.time_limit && (
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Czas: {assignment.exams.time_limit} min
                                </div>
                              )}
                              <div className="flex items-center text-gray-500">
                                <FileText className="h-4 w-4 mr-2" />
                                Próby: {getCompletedAttemptsCount(assignment.exams.id)}/{assignment.exams.max_attempts}
                              </div>
                              <div className="flex items-center text-gray-500">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Pytań: {assignment.exams.questions_per_exam || 'Wszystkie'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 sm:ml-6">
                            <button 
                              onClick={() => handleStartExam(assignment.exams)}
                              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                            >
                              Rozpocznij egzamin
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div>
                {assignedMaterials.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Brak przypisanych materiałów</h3>
                    <p className="text-sm sm:text-base text-gray-500 px-4">Nie masz jeszcze przypisanych materiałów szkoleniowych.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {assignedMaterials.map((assignment) => {
                      const progress = materialProgress.find(p => p.material_id === assignment.material_id);
                      const material = assignment.training_materials;
                      
                      return (
                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                                <div className="flex items-center mb-2 sm:mb-0">
                                  {getMaterialIcon(material.type)}
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 ml-2">{material.title}</h3>
                                </div>
                                <div className="flex items-center space-x-2 sm:ml-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {material.type.toUpperCase()}
                                  </span>
                                  {assignment.is_required && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Obowiązkowy
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    progress?.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    progress?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {progress?.status === 'completed' ? 'Ukończony' :
                                     progress?.status === 'in_progress' ? 'W trakcie' :
                                     'Nie rozpoczęty'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm sm:text-base text-gray-600 mb-4">{material.description}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center text-gray-500">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Przypisano: {new Date(assignment.assigned_at).toLocaleDateString('pl-PL')}
                                </div>
                                {assignment.due_date && (
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Termin: {new Date(assignment.due_date).toLocaleDateString('pl-PL')}
                                  </div>
                                )}
                                {material.duration && (
                                  <div className="flex items-center text-gray-500">
                                    <Play className="h-4 w-4 mr-2" />
                                    Czas: {material.duration} min
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-0 sm:ml-6">
                              <button 
                                onClick={() => handleMaterialClick(assignment)}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                              >
                                {material.type === 'link' ? (
                                  <>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Otwórz link
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Zobacz materiał
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Completed Exams Tab */}
            {activeTab === 'completed' && (
              <div>
                {completedExams.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Brak zdanych egzaminów</h3>
                    <p className="text-sm sm:text-base text-gray-500">Ukończ pierwszy egzamin, aby zobaczyć go tutaj.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {completedExams.map((assignment) => {
                      const bestAttempt = attempts
                        .filter(attempt => attempt.exam_id === assignment.exams.id && attempt.passed)
                        .sort((a, b) => b.score - a.score)[0];
                      
                      return (
                        <div key={assignment.id} className="border border-green-200 rounded-lg p-3 sm:p-4 bg-green-50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center">
                              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-3 sm:mr-4 flex-shrink-0" />
                              <div>
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{assignment.exams.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Najlepszy wynik: {bestAttempt?.score}% • 
                                  Ukończono: {new Date(bestAttempt?.completed_at).toLocaleDateString('pl-PL')}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 sm:mt-0">
                              <button
                                onClick={() => handleViewCertificate(bestAttempt)}
                                className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs sm:text-sm"
                              >
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Zobacz certyfikat
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                {attempts.filter(a => a.completed_at).length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Brak historii egzaminów</h3>
                    <p className="text-sm sm:text-base text-gray-500">Ukończ pierwszy egzamin, aby zobaczyć historię.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {attempts.filter(a => a.completed_at).map((attempt) => (
                      <div key={attempt.id} className={`border rounded-lg p-4 ${
                        attempt.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center">
                            {attempt.passed ? (
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-3 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-3 flex-shrink-0" />
                            )}
                            <div>
                              <h3 className="text-sm sm:text-base font-medium text-gray-900">{attempt.exams?.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                                <span>Wynik: {attempt.score}%</span>
                                <span>Data: {new Date(attempt.completed_at).toLocaleDateString('pl-PL')}</span>
                                <span>Próba: {attempt.attempt_number}</span>
                                <span className={`font-medium ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                  {attempt.passed ? 'ZDANY' : 'NIEZDANY'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                            <button
                              onClick={() => handleViewHistory(attempt)}
                              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Szczegóły
                            </button>
                            {attempt.passed && (
                              <button
                                onClick={() => handleViewCertificate(attempt)}
                                className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs sm:text-sm"
                              >
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Certyfikat
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div>
                {certificates.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Award className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Brak certyfikatów</h3>
                    <p className="text-sm sm:text-base text-gray-500">Zdaj pierwszy egzamin, aby otrzymać certyfikat.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {certificates.map((certificate) => (
                      <div key={certificate.id} className="border border-purple-200 rounded-lg p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                        <div className="flex items-center mb-4">
                          <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">{certificate.certificate_data.SZKOLENIE || certificate.exams?.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Certyfikat ukończenia</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
                          <div className="flex justify-between">
                            <span>Wynik:</span>
                            <span className="font-medium text-green-600">Zdany</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data ukończenia:</span>
                            <span>{new Date(certificate.generated_at).toLocaleDateString('pl-PL')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ID certyfikatu:</span>
                            <span className="font-mono text-xs truncate ml-2">{certificate.id}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setSelectedCertificate({
                                examTitle: certificate.certificate_data.SZKOLENIE || certificate.exams?.title,
                                participantName: certificate.certificate_data.IMIE_NAZWISKO,
                                completionDate: certificate.generated_at,
                                score: 'Zdany',
                                certificateId: certificate.id,
                                kompetencje: certificate.certificate_data.KOMPETENCJE,
                                opisUkonczenia: certificate.certificate_data.OPIS_UKONCZENIA,
                                pdfUrl: certificate.pdf_url
                              });
                              setShowCertificate(true);
                            }}
                            className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-xs sm:text-sm"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Zobacz
                          </button>
                          <button
                            onClick={() => {
                              if (certificate.pdf_url) {
                                window.open(certificate.pdf_url, '_blank');
                              } else {
                                // Fallback to print
                                setSelectedCertificate({
                                  examTitle: certificate.certificate_data.SZKOLENIE || certificate.exams?.title,
                                  participantName: certificate.certificate_data.IMIE_NAZWISKO,
                                  completionDate: certificate.generated_at,
                                  score: 'Zdany',
                                  certificateId: certificate.id,
                                  kompetencje: certificate.certificate_data.KOMPETENCJE,
                                  opisUkonczenia: certificate.certificate_data.OPIS_UKONCZENIA,
                                  pdfUrl: certificate.pdf_url
                                });
                                setShowCertificate(true);
                                setTimeout(() => window.print(), 500);
                              }
                            }}
                            className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-xs sm:text-sm"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Pobierz
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exam Result Modal */}
      <ExamResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        result={examResult}
        examTitle={selectedExam?.title || ''}
      />

      {/* Exam History Modal */}
      {showHistory && selectedAttempt && (
        <ExamHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          attempt={selectedAttempt}
        />
      )}

      {/* Certificate Modal */}
      {showCertificate && selectedCertificate && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          certificate={selectedCertificate}
        />
      )}

      {/* Material Viewer Modal */}
      {showMaterialViewer && selectedMaterial && (
        <MaterialViewerModal
          isOpen={showMaterialViewer}
          onClose={() => setShowMaterialViewer(false)}
          material={selectedMaterial}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={userProfile}
        onProfileUpdate={loadUserData}
      />
    </div>
  );
};

export default SimpleParticipantDashboard;