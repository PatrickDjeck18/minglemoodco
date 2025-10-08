import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Play, Image, Headphones, ExternalLink, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MaterialViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: any;
}

const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({ isOpen, onClose, material }) => {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      // Load current progress
      loadProgress();
    }
  }, [isOpen, material]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('material_progress')
        .select('*')
        .eq('material_id', material.id)
        .eq('participant_id', user.id)
        .single();

      if (!error && data) {
        setProgress(data.progress_percentage || 0);
        setCompleted(data.status === 'completed');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const updateProgress = async (newProgress: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const status = newProgress >= 100 ? 'completed' : 'in_progress';
      const updateData: any = {
        material_id: material.id,
        participant_id: user.id,
        progress_percentage: newProgress,
        status,
        last_accessed_at: new Date().toISOString()
      };

      if (status === 'completed' && !completed) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('material_progress')
        .upsert(updateData);

      if (!error) {
        setProgress(newProgress);
        setCompleted(status === 'completed');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleMarkComplete = () => {
    updateProgress(100);
  };

  const getIcon = () => {
    switch (material.type) {
      case 'video':
        return <Play className="h-6 w-6" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-6 w-6" />;
      case 'image':
        return <Image className="h-6 w-6" />;
      case 'audio':
        return <Headphones className="h-6 w-6" />;
      case 'link':
        return <ExternalLink className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const renderContent = () => {
    if (material.type === 'video') {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            controls
            className="w-full h-full"
            onTimeUpdate={(e) => {
              const video = e.target as HTMLVideoElement;
              const progressPercent = (video.currentTime / video.duration) * 100;
              if (progressPercent > progress) {
                updateProgress(Math.round(progressPercent));
              }
            }}
          >
            <source src={material.file_url} type="video/mp4" />
            Twoja przeglądarka nie obsługuje odtwarzania wideo.
          </video>
        </div>
      );
    }

    if (material.type === 'audio') {
      return (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Headphones className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <audio
            controls
            className="w-full max-w-md mx-auto"
            onTimeUpdate={(e) => {
              const audio = e.target as HTMLAudioElement;
              const progressPercent = (audio.currentTime / audio.duration) * 100;
              if (progressPercent > progress) {
                updateProgress(Math.round(progressPercent));
              }
            }}
          >
            <source src={material.file_url} type="audio/mpeg" />
            Twoja przeglądarka nie obsługuje odtwarzania audio.
          </audio>
        </div>
      );
    }

    if (material.type === 'image') {
      return (
        <div className="text-center">
          <img
            src={material.file_url}
            alt={material.title}
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            onLoad={() => updateProgress(100)}
          />
        </div>
      );
    }

    if (material.type === 'pdf') {
      return (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Dokument PDF</p>
          <iframe
            src={material.file_url}
            className="w-full h-96 border rounded-lg"
            title={material.title}
          />
        </div>
      );
    }

    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        {getIcon()}
        <p className="text-gray-600 mt-4">Materiał dostępny do pobrania</p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                {getIcon()}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{material.title}</h2>
                <p className="text-sm text-gray-600">{material.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {material.file_url && (
                <a
                  href={material.file_url}
                  download
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Pobierz
                </a>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Postęp</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  completed ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {completed && (
              <div className="flex items-center mt-2 text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Ukończono</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {renderContent()}
          
          {/* Mark Complete Button */}
          {!completed && (
            <div className="mt-6 text-center">
              <button
                onClick={handleMarkComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                <CheckCircle className="h-5 w-5 mr-2 inline" />
                Oznacz jako ukończone
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Typ:</span> {material.type.toUpperCase()}
              {material.file_size && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">Rozmiar:</span> {(material.file_size / 1024 / 1024).toFixed(1)} MB
                </>
              )}
              {material.duration && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">Czas trwania:</span> {material.duration} min
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialViewerModal;