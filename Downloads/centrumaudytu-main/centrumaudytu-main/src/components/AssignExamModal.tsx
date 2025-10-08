import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Users, BookOpen, UserPlus, UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssignExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentCreated: () => void;
  exams: any[];
  groups: any[];
  preSelectedExam?: any;
}

const AssignExamModal: React.FC<AssignExamModalProps> = ({ 
  isOpen, 
  onClose, 
  onAssignmentCreated,
  exams,
  groups,
  preSelectedExam
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [assignmentType, setAssignmentType] = useState<'group' | 'individual'>('individual');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participants, setParticipants] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadParticipants();
      if (preSelectedExam) {
        setSelectedExam(preSelectedExam.id);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup);
    } else {
      setGroupMembers([]);
      setSelectedParticipants([]);
    }
  }, [selectedGroup]);

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

  const loadGroupMembers = async (groupId: string) => {
    setLoadingGroupMembers(true);
    setGroupMembers([]);
    setSelectedParticipants([]);
    
    try {
      console.log('🔄 Loading group members for group:', groupId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'participant')
        .eq('group_id', groupId)
        .order('email');

      if (error) {
        console.error('❌ Error loading group members:', error);
        setGroupMembers([]);
      } else {
        console.log('✅ Loaded group members:', data?.length || 0);
        setGroupMembers(data || []);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const resetForm = () => {
    setSelectedExam(preSelectedExam?.id || '');
    setAssignmentType('individual');
    setSelectedGroup('');
    setSelectedParticipants([]);
    setGroupMembers([]);
    setError('');
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

      if (assignmentType === 'individual') {
        // Assign to individual participants
        const assignments = selectedParticipants.map(participantId => ({
          exam_id: selectedExam,
          participant_id: participantId,
          assigned_by: user.id
        }));

        const { error } = await supabase
          .from('exam_assignments')
          .insert(assignments);

        if (error) throw error;
      } else {
        // Assign to entire group (all current and future members)
        const { error } = await supabase
          .from('exam_assignments')
          .insert({
            exam_id: selectedExam,
            group_id: selectedGroup,
            assigned_by: user.id
          });

        if (error) throw error;
      }

      onAssignmentCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error assigning exam:', error);
      setError(error.message || 'Wystąpił błąd podczas przypisywania egzaminu');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const toggleAllParticipants = () => {
    const currentParticipants = assignmentType === 'group' ? groupMembers : participants;
    const allIds = currentParticipants.map(p => p.id);
    const allSelected = allIds.every(id => selectedParticipants.includes(id));
    
    if (allSelected) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(allIds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Przypisz egzamin</h2>
            <p className="text-sm text-gray-600 mt-1">Przypisz egzamin do grupy lub poszczególnych uczestników</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
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

          <div className="space-y-6">
            {/* Select Exam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {preSelectedExam ? 'Wybrany egzamin' : 'Wybierz egzamin'} <span className="text-red-500">*</span>
              </label>
              {preSelectedExam ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-sm">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">{preSelectedExam.title}</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">{preSelectedExam.description}</p>
                </div>
              ) : (
                <select
                  required
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- Wybierz egzamin --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sposób przypisania
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="individual"
                    checked={assignmentType === 'individual'}
                    onChange={(e) => setAssignmentType(e.target.value as 'group' | 'individual')}
                    className="mr-2"
                  />
                  <UserPlus className="h-4 w-4 mr-1" />
                  Wybierz kursantów
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="group"
                    checked={assignmentType === 'group'}
                    onChange={(e) => setAssignmentType(e.target.value as 'group' | 'individual')}
                    className="mr-2"
                  />
                  <Users className="h-4 w-4 mr-1" />
                  Cała grupa
                </label>
              </div>
            </div>

            {/* Group Selection */}
            {assignmentType === 'group' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz grupę <span className="text-red-500">*</span>
                </label>
                <select
                  required
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
              </div>
            )}

            {/* Participants Selection */}
            {assignmentType === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz kursantów <span className="text-red-500">*</span>
                </label>
                
                {/* Select All Button */}
                {participants.length > 0 && (
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={toggleAllParticipants}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                    >
                      {participants.every(p => selectedParticipants.includes(p.id)) ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                    </button>
                    <span className="text-sm text-gray-500">
                      Wybrano: {selectedParticipants.length} / {participants.length}
                    </span>
                  </div>
                )}
                
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Brak dostępnych kursantów
                    </div>
                  ) : (
                    <div className="p-2">
                      {participants.map((participant) => (
                        <label
                          key={participant.id}
                          className="flex items-center p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(participant.id)}
                            onChange={() => toggleParticipant(participant.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {participant.first_name?.[0] || participant.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {participant.first_name && participant.last_name
                                ? `${participant.first_name} ${participant.last_name}`
                                : participant.email
                              }
                            </div>
                            <div className="text-sm text-gray-500 truncate">{participant.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Group Members Selection */}
            {assignmentType === 'group' && selectedGroup && false && (
              <div>
               <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kursanci z grupy "{groups.find(g => g.id === selectedGroup)?.name}" <span className="text-red-500">*</span>
                </label>
                
                {loadingGroupMembers ? (
                  <div className="border border-gray-300 rounded-md p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Ładowanie członków grupy...</p>
                  </div>
                ) : (
                  <>
                    {/* Select All Button */}
                    {groupMembers.length > 0 && (
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = groupMembers.map(p => p.id);
                            const allSelected = allIds.every(id => selectedParticipants.includes(id));
                            if (allSelected) {
                              setSelectedParticipants([]);
                            } else {
                              setSelectedParticipants(allIds);
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                        >
                          {groupMembers.every(p => selectedParticipants.includes(p.id)) ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                        </button>
                        <span className="text-sm text-gray-500">
                          Wybrano: {selectedParticipants.length} / {groupMembers.length}
                        </span>
                      </div>
                    )}
                    
                    <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                      {groupMembers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Brak kursantów w tej grupie
                        </div>
                      ) : (
                        <div className="p-2">
                          {groupMembers.map((participant) => (
                            <label
                              key={participant.id}
                              className="flex items-center p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedParticipants.includes(participant.id)}
                                onChange={() => toggleParticipant(participant.id)}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-semibold text-xs">
                                  {participant.first_name?.[0] || participant.email[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {participant.first_name && participant.last_name
                                    ? `${participant.first_name} ${participant.last_name}`
                                    : participant.email
                                  }
                                </div>
                                <div className="text-sm text-gray-500 truncate">{participant.email}</div>
                                <div className="text-xs text-green-600 font-medium">Członek grupy</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
               </>
                </div>
            )}

            {/* Group Assignment Info */}
            {assignmentType === 'group' && selectedGroup && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Egzamin zostanie przypisany do całej grupy
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Wszyscy obecni i przyszli członkowie grupy "{groups.find(g => g.id === selectedGroup)?.name}" 
                      będą mieli dostęp do tego egzaminu.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !selectedExam || (assignmentType === 'individual' && selectedParticipants.length === 0) || (assignmentType === 'group' && !selectedGroup)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {loading ? 'Przypisywanie...' : 'Przypisz egzamin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignExamModal;