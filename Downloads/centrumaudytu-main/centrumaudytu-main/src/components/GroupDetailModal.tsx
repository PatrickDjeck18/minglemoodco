import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Plus, AlertCircle, CheckCircle, Clock, UserPlus, BookOpen, BarChart3, Trophy, Eye, Calendar, Award, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Group, Invitation } from '../lib/supabase';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

interface GroupMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface ExamAssignment {
  id: string;
  exam_id: string;
  assigned_at: string;
  exams: {
    id: string;
    title: string;
    description: string;
    passing_score: number;
    max_attempts: number;
    created_at: string;
  };
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  participant_id: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  passed: boolean;
  attempt_number: number;
  profiles: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({ isOpen, onClose, group }) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [examAssignments, setExamAssignments] = useState<ExamAssignment[]>([]);
  const [selectedExamAttempts, setSelectedExamAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'exam-details'>('overview');
  const [selectedExam, setSelectedExam] = useState<ExamAssignment | null>(null);
  const [examDetailsLoading, setExamDetailsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGroupData();
    }
  }, [isOpen, group.id]);

  const loadGroupData = async () => {
    try {
      console.log('🔄 Loading group data for group:', group.id);
      
      // Load group members
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('group_id', group.id)
        .eq('role', 'participant')
        .order('created_at', { ascending: false });

      if (membersError) {
        console.error('Error loading members:', membersError);
        setMembers([]);
      } else {
        console.log('👥 Loaded members:', membersData?.length || 0);
        setMembers(membersData || []);
      }

      // Load pending invitations - exclude emails that are already group members
      const memberEmails = membersData?.map(m => m.email) || [];
      
      let invitationsQuery = supabase
        .from('invitations')
        .select('*, groups(name)')
        .eq('group_id', group.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Only add email filter if there are member emails to exclude
      if (memberEmails.length > 0) {
        invitationsQuery = invitationsQuery.not('email', 'in', `(${memberEmails.map(email => `"${email}"`).join(',')})`);
      }

      const { data: invitationsData, error: invitationsError } = await invitationsQuery;

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError);
        setInvitations([]);
      } else {
        console.log('📧 Loaded pending invitations:', invitationsData?.length || 0);
        setInvitations(invitationsData || []);
      }

      // Load exam assignments for this group
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('exam_assignments')
        .select(`
          *,
          exams (
            id,
            title,
            description,
            passing_score,
            max_attempts,
            created_at
          )
        `)
        .eq('group_id', group.id)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) {
        console.error('Error loading exam assignments:', assignmentsError);
      } else {
        setExamAssignments(assignmentsData || []);
      }
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = async (examAssignment: ExamAssignment) => {
    setExamDetailsLoading(true);
    try {
      // Get all attempts for this exam from group members
      const memberIds = members.map(m => m.id);
      
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          profiles (
            email,
            first_name,
            last_name
          )
        `)
        .eq('exam_id', examAssignment.exam_id)
        .in('participant_id', memberIds)
        .order('started_at', { ascending: false });

      if (attemptsError) {
        console.error('Error loading exam attempts:', attemptsError);
        setSelectedExamAttempts([]);
      } else {
        setSelectedExamAttempts(attemptsData || []);
      }
    } catch (error) {
      console.error('Error loading exam details:', error);
      setSelectedExamAttempts([]);
    } finally {
      setExamDetailsLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Użytkownik nie jest zalogowany');
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', inviteEmail)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.group_id === group.id) {
          setInviteError('Użytkownik już należy do tej grupy');
          setInviteLoading(false);
          return;
        }
        
        // User exists but not in this group, add directly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ group_id: group.id })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        setInviteSuccess('Użytkownik został dodany do grupy');
        
        // Reload data immediately to reflect changes
        setTimeout(() => {
          loadGroupData();
        }, 500);
      } else {
        // Check if invitation already exists for this email
        const { data: existingInvitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', inviteEmail)
          .eq('group_id', group.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (existingInvitation) {
          setInviteError('Zaproszenie dla tego adresu email już istnieje');
          setInviteLoading(false);
          return;
        }

        // Create invitation
        const { data: newInvitation, error: inviteError } = await supabase
          .from('invitations')
          .insert({
            email: inviteEmail,
            group_id: group.id,
            invited_by: user.id,
          })
          .select()
          .single();

        if (inviteError) {
          throw inviteError;
        }

        // Generate invitation link
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}/invite/${newInvitation.token}`;
        
        console.log('🔗 Generated invitation link:', inviteUrl);
        
        // Send actual email invitation
        try {
          const emailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: inviteEmail,
              groupId: group.id,
              groupName: group.name,
              inviterName: 'Administrator Centrum Audytu',
              baseUrl: baseUrl
            })
          });

          if (emailResponse.ok) {
            const emailResult = await emailResponse.json();
            console.log('📧 Email sent successfully:', emailResult.emailId);
            setInviteSuccess(`✅ Zaproszenie zostało wysłane na ${inviteEmail}! Sprawdź skrzynkę odbiorczą.`);
          } else {
            const emailError = await emailResponse.json();
            console.error('❌ Email sending failed:', emailError);
            setInviteSuccess(`✅ Zaproszenie utworzone dla ${inviteEmail}! Link: ${inviteUrl} (Email nie został wysłany: ${emailError.error})`);
          }
        } catch (emailError) {
          console.error('❌ Email sending error:', emailError);
          setInviteSuccess(`✅ Zaproszenie utworzone dla ${inviteEmail}! Link: ${inviteUrl} (Błąd wysyłania emaila)`);
        }
        
        // Reload data after sending invitation
        setTimeout(() => {
          loadGroupData();
        }, 1000);
      }

      setInviteEmail('');
      
    } catch (error: any) {
      console.error('Error inviting user:', error);
      setInviteError(error.message || 'Wystąpił błąd podczas wysyłania zaproszenia');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleViewExamDetails = async (examAssignment: ExamAssignment) => {
    setSelectedExam(examAssignment);
    setActiveTab('exam-details');
    await loadExamDetails(examAssignment);
  };

  const getParticipantStats = (participantId: string, examId: string) => {
    const participantAttempts = selectedExamAttempts.filter(
      attempt => attempt.participant_id === participantId && attempt.exam_id === examId
    );
    
    const completedAttempts = participantAttempts.filter(attempt => attempt.completed_at);
    const bestAttempt = completedAttempts.reduce((best, current) => 
      !best || (current.score || 0) > (best.score || 0) ? current : best
    , null as ExamAttempt | null);
    
    const passed = completedAttempts.some(attempt => attempt.passed);
    
    return {
      totalAttempts: completedAttempts.length,
      bestScore: bestAttempt?.score || 0,
      passed,
      lastAttempt: completedAttempts[0]?.completed_at,
    };
  };

  const exportResults = () => {
    if (!selectedExam) return;

    // Prepare CSV data
    const headers = ['Imię i nazwisko', 'Email', 'Status', 'Najlepszy wynik (%)', 'Liczba prób', 'Ostatnia próba'];
    const csvData = [headers];

    members.forEach(member => {
      const stats = getParticipantStats(member.id, selectedExam.exam_id);
      const fullName = member.first_name && member.last_name 
        ? `${member.first_name} ${member.last_name}`
        : member.email;
      
      let status = 'Nie rozpoczął';
      if (stats.totalAttempts > 0) {
        status = stats.passed ? 'Zdany' : 'Niezdany';
      }

      const lastAttemptDate = stats.lastAttempt 
        ? new Date(stats.lastAttempt).toLocaleDateString('pl-PL')
        : '-';

      csvData.push([
        fullName,
        member.email,
        status,
        stats.totalAttempts > 0 ? stats.bestScore.toString() : '0',
        `${stats.totalAttempts}/${selectedExam.exams.max_attempts}`,
        lastAttemptDate
      ]);
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const fileName = `wyniki_${selectedExam.exams.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 line-clamp-1">{group.name}</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Zarządzanie grupą i egzaminami</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 sm:p-2 rounded-full hover:bg-gray-100 flex-shrink-0"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mt-4 sm:mt-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Przegląd grupy
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center ${
                activeTab === 'exams'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Egzaminy grupy</span>
              <span className="sm:hidden">Egzaminy</span>
              <span className="ml-1">({examAssignments.length})</span>
            </button>
            {selectedExam && (
              <button
                onClick={() => setActiveTab('exam-details')}
                className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center ${
                  activeTab === 'exam-details'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Wyniki: {selectedExam.exams.title}</span>
                <span className="sm:hidden">Wyniki</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
                  <div className="flex items-center">
                    <div className="p-2 sm:p-3 bg-blue-600 rounded-lg">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Członkowie</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{members.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 sm:p-6 border border-yellow-200">
                  <div className="flex items-center">
                    <div className="p-2 sm:p-3 bg-yellow-600 rounded-lg">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-yellow-900">Oczekujące</p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{invitations.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center">
                    <div className="p-2 sm:p-3 bg-green-600 rounded-lg">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-green-900">Egzaminy</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">{examAssignments.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invite User Form */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  Dodaj użytkownika do grupy
                </h3>

                {inviteError && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-red-700 text-xs sm:text-sm">{inviteError}</span>
                  </div>
                )}

                {inviteSuccess && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-green-700 text-xs sm:text-sm">
                      <div>{inviteSuccess.split('Link: ')[0]}</div>
                      {inviteSuccess.includes('Link: ') && !inviteSuccess.includes('Sprawdź skrzynkę') && (
                        <div className="mt-2">
                          <strong>Link zapraszający:</strong>
                          <div className="mt-1 p-2 bg-white border border-green-300 rounded font-mono text-xs break-all max-w-full overflow-hidden">
                            {inviteSuccess.split('Link: ')[1]}
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(inviteSuccess.split('Link: ')[1])}
                            className="mt-2 px-2 sm:px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            📋 Skopiuj link
                          </button>
                        </div>
                      )}
                      {inviteSuccess.includes('Sprawdź skrzynkę') && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-blue-800 font-medium text-sm">Email został wysłany!</span>
                          </div>
                          <p className="text-blue-700 text-xs mt-1">
                            Użytkownik otrzymał profesjonalny email z linkiem zapraszającym.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="adres@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                  >
                    <Mail className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                    {inviteLoading ? 'Wysyłanie...' : 'Wyślij zaproszenie'}
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-2 sm:mt-3 px-1">
                  💡 Jeśli użytkownik ma już konto, zostanie dodany natychmiast. W przeciwnym razie otrzyma zaproszenie email.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Members List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                      Członkowie grupy ({members.length})
                    </h3>
                  </div>
                  <div className="p-3 sm:p-6">
                    {loading ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs sm:text-sm text-gray-600">Ładowanie...</p>
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-6 sm:py-12">
                        <Users className="h-10 w-10 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 font-medium">Brak członków</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Zaproś pierwszego użytkownika</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex items-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-4 flex-shrink-0">
                                <span className="text-white font-semibold text-xs sm:text-sm">
                                  {member.first_name?.[0] || member.email[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 text-xs sm:text-base truncate">
                                  {member.first_name && member.last_name 
                                    ? `${member.first_name} ${member.last_name}`
                                    : member.email
                                  }
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">{member.email}</p>
                                <p className="text-xs text-gray-400 hidden sm:block">
                                  Dołączył: {new Date(member.created_at).toLocaleDateString('pl-PL')}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap ml-2 flex-shrink-0">
                              Aktywny
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Invitations */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-yellow-600" />
                      Oczekujące zaproszenia ({invitations.length})
                    </h3>
                  </div>
                  <div className="p-3 sm:p-6">
                    {loading ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs sm:text-sm text-gray-600">Ładowanie...</p>
                      </div>
                    ) : invitations.length === 0 ? (
                      <div className="text-center py-6 sm:py-12">
                        <Mail className="h-10 w-10 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-gray-500 font-medium">Brak oczekujących zaproszeń</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Wszystkie zaproszenia zostały zaakceptowane</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                        {invitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between p-2 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-2 sm:mr-4 flex-shrink-0">
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 text-xs sm:text-base truncate">{invitation.email}</p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Wysłane: {new Date(invitation.created_at).toLocaleDateString('pl-PL')}
                                </p>
                                <p className="text-xs text-gray-400 hidden sm:block">
                                  Wygasa: {new Date(invitation.expires_at).toLocaleDateString('pl-PL')}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full whitespace-nowrap ml-2 flex-shrink-0">
                              Oczekuje
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div>
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Egzaminy przypisane do grupy</h3>
                <p className="text-sm sm:text-base text-gray-600">Kliknij na egzamin, aby zobaczyć szczegółowe wyniki kursantów</p>
              </div>

              {examAssignments.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Brak przypisanych egzaminów</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 px-4">Ta grupa nie ma jeszcze przypisanych żadnych egzaminów</p>
                  <button
                    onClick={onClose}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Utwórz nowy egzamin
                  </button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {examAssignments.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => handleViewExamDetails(assignment)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2 sm:mb-3">
                            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
                              {assignment.exams.title}
                            </h4>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">{assignment.exams.description}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                            <div className="flex items-center text-xs sm:text-sm text-gray-500">
                              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                              Próg: {assignment.exams.passing_score}%
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-500">
                              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                              Max prób: {assignment.exams.max_attempts}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-500 col-span-2 sm:col-span-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="hidden sm:inline">Przypisano: </span>{new Date(assignment.assigned_at).toLocaleDateString('pl-PL')}
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-500">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                              Kursanci: {members.length}
                            </div>
                          </div>
                        </div>
                        <div className="sm:ml-6">
                          <button className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors duration-200 group-hover:bg-blue-700">
                            <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                            Zobacz wyniki
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exam Details Tab */}
          {activeTab === 'exam-details' && selectedExam && (
            <div>
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => setActiveTab('exams')}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 sm:mb-4 text-sm sm:text-base"
                >
                  ← Powrót do listy egzaminów
                </button>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 line-clamp-2">{selectedExam.exams.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 line-clamp-3">{selectedExam.exams.description}</p>
              </div>

              {/* Exam Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Próg</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-900">{selectedExam.exams.passing_score}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-900">Max prób</p>
                      <p className="text-lg sm:text-xl font-bold text-purple-900">{selectedExam.exams.max_attempts}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-900">Zdanych</p>
                      <p className="text-lg sm:text-xl font-bold text-green-900">
                        {members.filter(member => {
                          const stats = getParticipantStats(member.id, selectedExam.exam_id);
                          return stats.passed;
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Kursantów</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{members.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Results */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Wyniki kursantów</h4>
                  <button
                    onClick={exportResults}
                    className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Eksportuj CSV
                  </button>
                </div>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  {examDetailsLoading ? (
                    <div className="text-center py-8 sm:py-12 px-3">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-xs sm:text-sm text-gray-600">Ładowanie wyników...</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kursant
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <span className="hidden sm:inline">Najlepszy </span>Wynik
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <span className="hidden sm:inline">Liczba </span>Prób
                          </th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Ostatnia
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => {
                          const stats = getParticipantStats(member.id, selectedExam.exam_id);
                          return (
                            <tr key={member.id} className="hover:bg-gray-50 border-b border-gray-100">
                              <td className="px-3 sm:px-6 py-3 sm:py-4">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                    <span className="text-white font-medium text-xs sm:text-xs">
                                      {member.first_name?.[0] || member.email[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                      {member.first_name && member.last_name 
                                        ? `${member.first_name} ${member.last_name}`
                                        : member.email
                                      }
                                    </div>
                                    <div className="text-xs text-gray-500 truncate hidden sm:block">{member.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                {stats.totalAttempts === 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <span className="hidden sm:inline">Nie rozpoczął</span>
                                    <span className="sm:hidden">-</span>
                                  </span>
                                ) : stats.passed ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="hidden sm:inline">Zdany</span>
                                    <span className="sm:hidden">✓</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <X className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="hidden sm:inline">Niezdany</span>
                                    <span className="sm:hidden">✗</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {stats.totalAttempts > 0 ? `${stats.bestScore}%` : '-'}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm text-gray-900">
                                  {stats.totalAttempts}/{selectedExam.exams.max_attempts}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                                {stats.lastAttempt 
                                  ? new Date(stats.lastAttempt).toLocaleDateString('pl-PL')
                                  : '-'
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailModal;