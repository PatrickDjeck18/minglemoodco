import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Users, UserPlus, UsersIcon, Calendar, FileText, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssignMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentCreated: () => void;
  materials: any[];
  groups: any[];
}

const AssignMaterialModal: React.FC<AssignMaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  onAssignmentCreated,
  materials,
  groups
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [assignmentType, setAssignmentType] = useState<'group' | 'individual'>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participants, setParticipants] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    dueDate: '',
    isRequired: true,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadParticipants();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedGroup && expandedGroup === selectedGroup) {
      loadGroupMembers(selectedGroup);
    }
  }, [selectedGroup, expandedGroup]);

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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('group_id', groupId)
        .eq('role', 'participant')
        .order('email');

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    }
  };

  const resetForm = () => {
    setSelectedMaterial('');
    setAssignmentType('group');
    setSelectedGroup('');
    setSelectedParticipants([]);
    setGroupMembers([]);
    setExpandedGroup(null);
    setAssignmentData({
      dueDate: '',
      isRequired: true,
      notes: '',
    });
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

      const assignments = [];

      if (assignmentType === 'group') {
        // Assign to entire group
        assignments.push({
          material_id: selectedMaterial,
          group_id: selectedGroup,
          assigned_by: user.id,
          due_date: assignmentData.dueDate || null,
          is_required: assignmentData.isRequired,
          notes: assignmentData.notes || null,
        });
      } else {
        // Assign to individual participants
        assignments.push(...selectedParticipants.map(participantId => ({
          material_id: selectedMaterial,
          participant_id: participantId,
          assigned_by: user.id,
          due_date: assignmentData.dueDate || null,
          is_required: assignmentData.isRequired,
          notes: assignmentData.notes || null,
        })));
      }

      const { error } = await supabase
        .from('material_assignments')
        .insert(assignments);

      if (error) throw error;

      onAssignmentCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error assigning material:', error);
      setError(error.message || 'Wystąpił błąd podczas przypisywania materiału');
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

  const toggleAllGroupMembers = () => {
    const allMemberIds = groupMembers.map(member => member.id);
    const allSelected = allMemberIds.every(id => selectedParticipants.includes(id));
    
    if (allSelected) {
      // Deselect all group members
      setSelectedParticipants(prev => prev.filter(id => !allMemberIds.includes(id)));
    } else {
      // Select all group members
      setSelectedParticipants(prev => [...new Set([...prev, ...allMemberIds])]);
    }
  };

  const handleGroupExpand = (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setGroupMembers([]);
    } else {
      setExpandedGroup(groupId);
      loadGroupMembers(groupId);
    }
  };

  if (!isOpen) return null;

  const selectedMaterialData = materials.find(m => m.id === selectedMaterial);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Przypisz materiał</h2>
            <p className="text-sm text-gray-600 mt-1">Przypisz materiał do grupy lub poszczególnych uczestników</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
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
            {/* Select Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz materiał <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">-- Wybierz materiał --</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.title} ({material.type})
                  </option>
                ))}
              </select>
              {selectedMaterialData && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{selectedMaterialData.title}</p>
                      <p className="text-xs text-blue-700">{selectedMaterialData.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Typ przypisania
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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

                {/* Group Members Preview */}
                {selectedGroup && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleGroupExpand(selectedGroup)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {expandedGroup === selectedGroup ? 'Ukryj' : 'Pokaż'} członków grupy
                    </button>
                    
                    {expandedGroup === selectedGroup && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Członkowie grupy ({groupMembers.length})
                          </span>
                          <button
                            type="button"
                            onClick={toggleAllGroupMembers}
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors duration-200"
                          >
                            {groupMembers.every(member => selectedParticipants.includes(member.id)) 
                              ? 'Odznacz wszystkich' 
                              : 'Zaznacz wszystkich'
                            }
                          </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {groupMembers.map((member) => (
                            <label
                              key={member.id}
                              className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedParticipants.includes(member.id)}
                                onChange={() => toggleParticipant(member.id)}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {member.first_name && member.last_name
                                    ? `${member.first_name} ${member.last_name}`
                                    : member.email
                                  }
                                </div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Individual Participants Selection */}
            {assignmentType === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz uczestników <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
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
                {selectedParticipants.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Wybrano: {selectedParticipants.length} uczestników
                  </p>
                )}
              </div>
            )}

            {/* Assignment Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Termin wykonania
                </label>
                <input
                  type="date"
                  value={assignmentData.dueDate}
                  onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={assignmentData.isRequired}
                    onChange={(e) => setAssignmentData({ ...assignmentData, isRequired: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Materiał obowiązkowy</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notatki
              </label>
              <textarea
                rows={3}
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Dodatkowe informacje dla uczestników..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !selectedMaterial || (assignmentType === 'group' && !selectedGroup) || (assignmentType === 'individual' && selectedParticipants.length === 0)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {loading ? 'Przypisywanie...' : 'Przypisz materiał'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignMaterialModal;