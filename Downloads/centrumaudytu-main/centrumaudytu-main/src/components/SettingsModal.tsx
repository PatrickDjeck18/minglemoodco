import React, { useState } from 'react';
import { X, Shield, User, Bell, Lock, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import TwoFactorSetupModal from './TwoFactorSetupModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onProfileUpdate: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  userProfile,
  onProfileUpdate 
}) => {
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'security'>('main');

  const handle2FAToggle = () => {
    onProfileUpdate();
    setShow2FAModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ustawienia</h2>
              <p className="text-sm text-gray-600 mt-1">Zarządzaj swoim kontem i preferencjami</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Main Settings Menu */}
            {activeSection === 'main' && (
              <div className="space-y-4">
                {/* Profile Section */}
                <button
                  onClick={() => setActiveSection('profile')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Profil</h3>
                      <p className="text-sm text-gray-600">Imię, nazwisko, email</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                {/* Security Section */}
                <button
                  onClick={() => setActiveSection('security')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <Lock className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Bezpieczeństwo</h3>
                      <p className="text-sm text-gray-600">Hasło, 2FA, sesje</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>

                {/* Notifications Section */}
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 opacity-50 cursor-not-allowed">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                      <Bell className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Powiadomienia</h3>
                      <p className="text-sm text-gray-600">Wkrótce dostępne</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveSection('main')}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4"
                >
                  ← Powrót do ustawień
                </button>

                <div className="space-y-4">
                  {/* 2FA Setting */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Dwuskładnikowe uwierzytelnianie</h3>
                        <p className="text-sm text-gray-600">
                          {userProfile?.two_factor_enabled ? 'Włączone' : 'Wyłączone'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {userProfile?.two_factor_enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <button
                        onClick={() => setShow2FAModal(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          userProfile?.two_factor_enabled
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {userProfile?.two_factor_enabled ? 'Wyłącz' : 'Włącz'}
                      </button>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-50">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Lock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Zmiana hasła</h3>
                        <p className="text-sm text-gray-600">Wkrótce dostępne</p>
                      </div>
                    </div>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Zmień
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveSection('main')}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4"
                >
                  ← Powrót do ustawień
                </button>

                <div className="space-y-4">
                  <div className="text-center py-8">
                    <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Edycja profilu</h3>
                    <p className="text-sm text-gray-500">Funkcjonalność będzie dostępna wkrótce</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <TwoFactorSetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        userProfile={userProfile}
        onTwoFactorToggled={handle2FAToggle}
      />
    </>
  );
};

export default SettingsModal;