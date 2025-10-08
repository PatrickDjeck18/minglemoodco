import React, { useState } from 'react';
import { X, AlertCircle, Upload, Link, FileText, Video, Image, Headphones, Users, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaterialCreated: () => void;
}

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  onMaterialCreated 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [materialData, setMaterialData] = useState({
    title: '',
    description: '',
    type: 'pdf' as 'pdf' | 'video' | 'link' | 'document' | 'image' | 'audio',
    external_url: '',
    duration: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignAfterCreation, setAssignAfterCreation] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'group' | 'individual'>('group');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  const resetForm = () => {
    setMaterialData({
      title: '',
      description: '',
      type: 'pdf',
      external_url: '',
      duration: 0,
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
    setAssignAfterCreation(false);
    setAssignmentType('group');
    setSelectedGroup('');
    setSelectedParticipants([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        if (['pdf'].includes(extension)) {
          setMaterialData(prev => ({ ...prev, type: 'pdf' }));
        } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
          setMaterialData(prev => ({ ...prev, type: 'video' }));
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
          setMaterialData(prev => ({ ...prev, type: 'image' }));
        } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
          setMaterialData(prev => ({ ...prev, type: 'audio' }));
        } else {
          setMaterialData(prev => ({ ...prev, type: 'document' }));
        }
      }
    }
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  // Load groups and participants when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadGroupsAndParticipants();
    }
  }, [isOpen]);

  const loadGroupsAndParticipants = async () => {
    try {
      // Load groups
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .order('name');
      
      if (groupsData) {
        setGroups(groupsData);
      }

      // Load participants
      const { data: participantsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'participant')
        .order('email');
      
      if (participantsData) {
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error('Error loading groups and participants:', error);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `materials/${fileName}`;

    const { data, error } = await supabase.storage
      .from('training-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('training-materials')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
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

      let fileUrl = null;
      let fileSize = null;

      // Upload file if selected
      if (selectedFile) {
        setUploadProgress(25);
        fileUrl = await uploadFile(selectedFile);
        fileSize = selectedFile.size;
        setUploadProgress(75);
      }

      // Validate required fields
      if (materialData.type === 'link' && !materialData.external_url) {
        throw new Error('URL jest wymagany dla typu "Link"');
      }

      if (materialData.type !== 'link' && !selectedFile) {
        throw new Error('Plik jest wymagany dla tego typu materiału');
      }

      // Create material
      const { error: materialError } = await supabase
        .from('training_materials')
        .insert({
          title: materialData.title,
          description: materialData.description || null,
          type: materialData.type,
          file_url: fileUrl,
          external_url: materialData.type === 'link' ? materialData.external_url : null,
          file_size: fileSize,
          duration: materialData.duration > 0 ? materialData.duration : null,
          created_by: user.id,
        });

      if (materialError) throw materialError;

      setUploadProgress(100);

      // Handle assignment if enabled
      if (assignAfterCreation) {
        const { data: materialData } = await supabase
          .from('training_materials')
          .select('id')
          .eq('title', materialData.title)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (materialData) {
          if (assignmentType === 'group' && selectedGroup) {
            await supabase
              .from('material_assignments')
              .insert({
                material_id: materialData.id,
                group_id: selectedGroup,
                assigned_by: user.id,
              });
          } else if (assignmentType === 'individual' && selectedParticipants.length > 0) {
            const assignments = selectedParticipants.map(participantId => ({
              material_id: materialData.id,
              participant_id: participantId,
              assigned_by: user.id,
            }));
            
            await supabase
              .from('material_assignments')
              .insert(assignments);
          }
        }
      }

      onMaterialCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating material:', error);
      setError(error.message || 'Wystąpił błąd podczas tworzenia materiału');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'audio':
        return <Headphones className="h-5 w-5" />;
      case 'link':
        return <Link className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Nowy materiał szkoleniowy</h2>
            <p className="text-sm text-gray-600 mt-1">Dodaj materiał do biblioteki</p>
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

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Przesyłanie...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tytuł materiału <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={materialData.title}
                onChange={(e) => setMaterialData({ ...materialData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="np. Instrukcja BHP"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis materiału
              </label>
              <textarea
                rows={3}
                value={materialData.description}
                onChange={(e) => setMaterialData({ ...materialData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Krótki opis materiału szkoleniowego..."
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Typ materiału <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { value: 'pdf', label: 'PDF', icon: 'FileText' },
                  { value: 'video', label: 'Video', icon: 'Video' },
                  { value: 'document', label: 'Dokument', icon: 'FileText' },
                  { value: 'image', label: 'Obraz', icon: 'Image' },
                  { value: 'audio', label: 'Audio', icon: 'Headphones' },
                  { value: 'link', label: 'Link', icon: 'Link' },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      materialData.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={materialData.type === type.value}
                      onChange={(e) => setMaterialData({ ...materialData, type: e.target.value as any })}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      {getTypeIcon(type.value)}
                      <span className="ml-2 text-sm font-medium">{type.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload or URL Input */}
            {materialData.type === 'link' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={materialData.external_url}
                  onChange={(e) => setMaterialData({ ...materialData, external_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="https://example.com/material"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plik <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Wybierz plik</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept={
                            materialData.type === 'pdf' ? '.pdf' :
                            materialData.type === 'video' ? '.mp4,.avi,.mov,.wmv,.webm' :
                            materialData.type === 'image' ? '.jpg,.jpeg,.png,.gif,.webp,.svg' :
                            materialData.type === 'audio' ? '.mp3,.wav,.ogg,.aac' :
                            '.doc,.docx,.txt,.rtf'
                          }
                        />
                      </label>
                      <p className="pl-1">lub przeciągnij tutaj</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {materialData.type === 'pdf' && 'PDF do 50MB'}
                      {materialData.type === 'video' && 'MP4, AVI, MOV do 500MB'}
                      {materialData.type === 'image' && 'JPG, PNG, GIF do 10MB'}
                      {materialData.type === 'audio' && 'MP3, WAV, OGG do 100MB'}
                      {materialData.type === 'document' && 'DOC, DOCX, TXT do 50MB'}
                    </p>
                    {selectedFile && (
                      <p className="text-sm text-green-600 font-medium">
                        Wybrany plik: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Duration for video/audio */}
            {(materialData.type === 'video' || materialData.type === 'audio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Czas trwania (minuty)
                </label>
                <input
                  type="number"
                  min="0"
                  value={materialData.duration}
                  onChange={(e) => setMaterialData({ ...materialData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Assignment Section */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-3">Przypisanie materiału (opcjonalne)</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={assignAfterCreation}
                    onChange={(e) => setAssignAfterCreation(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-purple-900">Przypisz materiał po utworzeniu</span>
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
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {loading ? 'Tworzenie...' : 'Utwórz materiał'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMaterialModal;