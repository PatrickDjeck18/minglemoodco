import React, { useState } from 'react';
import { Plus, Users, BookOpen, BarChart3, Settings, LogOut, UserPlus, FileText, Upload, Eye, Calendar, Award, Play, ExternalLink, Image, Headphones, Trash2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreateExamModal from './CreateExamModal';
import CreateGroupModal from './CreateGroupModal';
import GroupDetailModal from './GroupDetailModal';
import AssignExamModal from './AssignExamModal';
import ImportQuestionsModal from './ImportQuestionsModal';
import CreateMaterialModal from './CreateMaterialModal';
import AssignMaterialModal from './AssignMaterialModal';
import SettingsModal from './SettingsModal';

interface SimpleAdminDashboardProps {
  user: { role: 'admin' | 'participant'; email: string };
  onLogout: () => void;
}

const SimpleAdminDashboard: React.FC<SimpleAdminDashboardProps> = ({ user, onLogout }) => {
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'groups' | 'materials'>('exams');
  
  // Modal states
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAssignExam, setShowAssignExam] = useState(false);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [showAssignMaterial, setShowAssignMaterial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedExamForAssignment, setSelectedExamForAssignment] = useState(null);

  // Load data from database or use fallback
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load user profile first
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!profileError && profile) {
            setUserProfile(profile);
          }
        }

        // Load data from database
        const [examsResult, groupsResult, materialsResult] = await Promise.all([
          supabase.from('exams').select('*').order('created_at', { ascending: false }),
          supabase.from('groups').select('*').order('created_at', { ascending: false }),
          supabase.from('training_materials').select('*').order('created_at', { ascending: false })
        ]);

        setExams(examsResult.data || []);
        setGroups(groupsResult.data || []);
        setMaterials(materialsResult?.data || []);
        
        if (examsResult.error) console.error('Error loading exams:', examsResult.error);
        if (groupsResult.error) console.error('Error loading groups:', groupsResult.error);
        if (materialsResult?.error) console.error('Error loading materials:', materialsResult.error);
      } catch (error) {
        console.error('Error loading data:', error);
        setExams([]);
        setGroups([]);
        setMaterials([]);
      }
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleDataRefresh = () => {
    setLoading(true);
    const loadData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!profileError && profile) {
            setUserProfile(profile);
          }
        }

        const [examsResult, groupsResult, materialsResult] = await Promise.all([
          supabase.from('exams').select('*').order('created_at', { ascending: false }),
          supabase.from('groups').select('*').order('created_at', { ascending: false }),
          supabase.from('training_materials').select('*').order('created_at', { ascending: false })
        ]);

        setExams(examsResult.data || []);
        setGroups(groupsResult.data || []);
        setMaterials(materialsResult?.data || []);
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a237e] via-[#2C3E91] to-[#0d1421] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-black/40"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
      }}></div>
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-2xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 sm:h-20 gap-3 sm:gap-0">
            <div className="flex items-center justify-center sm:justify-start">
              <img 
                src="/Logo Centrum Audytu New.svg" 
                alt="Logo Centrum Audytu" 
                className="h-14 sm:h-16 w-auto mr-3 sm:mr-6 drop-shadow-sm"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#2C3E91] to-[#1a237e] bg-clip-text text-transparent">
                  Panel Administratora
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Centrum Audytu - Zarządzanie platformą</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-4">
              <div className="flex items-center bg-gray-50 rounded-full px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#2C3E91] to-[#1a237e] rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-semibold text-sm">
                    {user.email[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-gray-700 font-medium truncate max-w-32 sm:max-w-none">
                Witaj, {user.email}
                </span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-white hover:bg-blue-500 transition-all duration-200 bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-500"
                title="Ustawienia konta"
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Ustawienia</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-white hover:bg-red-500 transition-all duration-200 bg-gray-100 rounded-lg border border-gray-200 hover:border-red-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Stats Cards as Clickable Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
          <button
            onClick={() => setActiveTab('exams')}
            className={`text-left p-6 sm:p-8 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'exams' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl scale-105 ring-4 ring-blue-300/50' 
                : 'bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:bg-blue-50/80 border border-white/20'
            }`}
          >
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg ${
                activeTab === 'exams' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-blue-100 to-blue-200'
              }`}>
                <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  activeTab === 'exams' ? 'text-white' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm font-medium ${
                  activeTab === 'exams' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  Egzaminy
                </p>
                <p className={`text-xl sm:text-2xl font-semibold ${
                  activeTab === 'exams' ? 'text-white' : 'text-gray-800'
                }`}>
                  {exams.length}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`text-left p-6 sm:p-8 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'groups' 
                ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-2xl scale-105 ring-4 ring-green-300/50' 
                : 'bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:bg-green-50/80 border border-white/20'
            }`}
          >
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg ${
                activeTab === 'groups' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-green-100 to-green-200'
              }`}>
                <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  activeTab === 'groups' ? 'text-white' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm font-medium ${
                  activeTab === 'groups' ? 'text-green-100' : 'text-gray-500'
                }`}>
                  Grupy
                </p>
                <p className={`text-xl sm:text-2xl font-semibold ${
                  activeTab === 'groups' ? 'text-white' : 'text-gray-800'
                }`}>
                  {groups.length}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`text-left p-6 sm:p-8 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'materials' 
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-2xl scale-105 ring-4 ring-purple-300/50' 
                : 'bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:bg-purple-50/80 border border-white/20'
            }`}
          >
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg ${
                activeTab === 'materials' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-purple-100 to-purple-200'
              }`}>
                <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  activeTab === 'materials' ? 'text-white' : 'text-purple-600'
                }`} />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className={`text-xs sm:text-sm font-medium ${
                  activeTab === 'materials' ? 'text-purple-100' : 'text-gray-500'
                }`}>
                  Materiały
                </p>
                <p className={`text-xl sm:text-2xl font-semibold ${
                  activeTab === 'materials' ? 'text-white' : 'text-gray-800'
                }`}>
                  {materials.length}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <>
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Zarządzanie egzaminami</h2>
                    <p className="text-sm sm:text-base text-gray-600">Twórz i zarządzaj egzaminami dla kursantów</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button 
                      onClick={() => setShowAssignExam(true)}
                      className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Przypisz egzamin
                    </button>
                    <button 
                      onClick={() => setShowCreateExam(true)}
                      className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nowy egzamin
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                {exams.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Brak egzaminów</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Utwórz pierwszy egzamin dla swoich kursantów i zacznij zarządzać procesem szkoleniowym</p>
                    <button 
                      onClick={() => setShowCreateExam(true)}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2 inline" />
                      Utwórz egzamin
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {exams.map((exam) => (
                      <div key={exam.id} className="bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/50 rounded-2xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:border-blue-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                              <span className="self-start sm:self-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-semibold rounded-full shadow-sm">
                                Aktywny
                              </span>
                            </div>
                            <p className="text-gray-700 mb-6 line-clamp-2 text-base">{exam.description}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center text-gray-500">
                                <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>Próg: {exam.passing_score}%</span>
                              </div>
                              {exam.time_limit && (
                                <div className="flex items-center text-gray-500">
                                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span>Czas: {exam.time_limit} min</span>
                                </div>
                              )}
                              <div className="flex items-center text-gray-500">
                                <Award className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>Próby: {exam.max_attempts}</span>
                              </div>
                              <div className="flex items-center text-gray-500">
                                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>Pytań: {exam.questions_per_exam || 'Wszystkie'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                            <button 
                              onClick={() => {
                                setSelectedExamForAssignment(exam);
                                setShowAssignExam(true);
                              }}
                              className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Przypisz
                            </button>
                            <button className="flex items-center justify-center px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Usuń
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <>
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Zarządzanie grupami</h2>
                    <p className="text-sm sm:text-base text-gray-600">Organizuj kursantów w grupy i zarządzaj dostępem</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nowa grupa
                  </button>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                {groups.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Brak grup</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Utwórz pierwszą grupę dla swoich kursantów i zacznij organizować proces szkoleniowy</p>
                    <button 
                      onClick={() => setShowCreateGroup(true)}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2 inline" />
                      Utwórz grupę
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                      <div 
                        key={group.id} 
                        className="bg-gradient-to-br from-white to-green-50/30 border border-gray-200/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:border-green-300/50"
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className="flex items-center mb-4">
                          <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mr-4 shadow-sm">
                            <Users className="h-7 w-7 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">{group.name}</h3>
                            <p className="text-sm text-gray-600 font-medium">Grupa kursantów</p>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                          <span>Utworzona: {new Date(group.created_at).toLocaleDateString('pl-PL')}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                            }}
                            className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                          >
                            Zarządzaj →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <>
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Materiały szkoleniowe</h2>
                    <p className="text-sm sm:text-base text-gray-600">Zarządzaj materiałami i przypisuj je do grup lub użytkowników</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button 
                      onClick={() => setShowAssignMaterial(true)}
                      className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Przypisz materiał
                    </button>
                    <button 
                      onClick={() => setShowCreateMaterial(true)}
                      className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nowy materiał
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                {materials.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Brak materiałów</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Dodaj pierwszy materiał szkoleniowy i zacznij budować bibliotekę zasobów</p>
                    <button 
                      onClick={() => setShowCreateMaterial(true)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2 inline" />
                      Dodaj materiał
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {materials.map((material) => (
                      <div key={material.id} className="bg-gradient-to-br from-white to-purple-50/30 border border-gray-200/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:border-purple-300/50">
                        <div className="flex items-center mb-4">
                          <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mr-4 shadow-sm">
                            {getMaterialIcon(material.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">{material.title}</h3>
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-purple-200 to-purple-300 text-purple-800 text-xs font-semibold rounded-full mt-2 shadow-sm">
                              {material.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {material.description && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">{material.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-4 border-t border-gray-100">
                          <span>Utworzono: {new Date(material.created_at).toLocaleDateString('pl-PL')}</span>
                          {material.duration && (
                            <span className="font-medium">{material.duration} min</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowAssignMaterial(true)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Przypisz
                          </button>
                          <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg transform hover:scale-105">
                            <Settings className="h-3 w-3 mr-1" />
                            Edytuj
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateExamModal
        isOpen={showCreateExam}
        onClose={() => setShowCreateExam(false)}
        onExamCreated={handleDataRefresh}
        userEmail={user.email}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleDataRefresh}
      />

      {selectedGroup && (
        <GroupDetailModal
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          group={selectedGroup}
        />
      )}

      <AssignExamModal
        isOpen={showAssignExam}
        onClose={() => {
          setShowAssignExam(false);
          setSelectedExamForAssignment(null);
        }}
        onAssignmentCreated={handleDataRefresh}
        exams={exams}
        groups={groups}
        preSelectedExam={selectedExamForAssignment}
      />

      <CreateMaterialModal
        isOpen={showCreateMaterial}
        onClose={() => setShowCreateMaterial(false)}
        onMaterialCreated={handleDataRefresh}
        groups={groups}
      />

      <AssignMaterialModal
        isOpen={showAssignMaterial}
        onClose={() => setShowAssignMaterial(false)}
        onAssignmentCreated={handleDataRefresh}
        materials={materials}
        groups={groups}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={userProfile}
        onProfileUpdate={handleDataRefresh}
      />
    </div>
  );
};

export default SimpleAdminDashboard;