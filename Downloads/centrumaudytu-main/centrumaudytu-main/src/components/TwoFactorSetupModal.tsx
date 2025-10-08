import React, { useState, useEffect } from 'react';
import { X, Shield, Smartphone, Key, Copy, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onTwoFactorToggled: () => void;
}

const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({ 
  isOpen, 
  onClose, 
  userProfile,
  onTwoFactorToggled 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'disable'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (userProfile?.two_factor_enabled) {
        setStep('disable');
      } else {
        generateTwoFactorSecret();
      }
    }
  }, [isOpen, userProfile]);

  const generateTwoFactorSecret = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile.id,
          email: userProfile.email
        })
      });

      if (!response.ok) {
        throw new Error('Błąd generowania kodu 2FA');
      }

      const data = await response.json();
      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setBackupCodes(data.backupCodes);
    } catch (error: any) {
      setError(error.message || 'Wystąpił błąd podczas generowania kodu 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Kod weryfikacyjny musi mieć 6 cyfr');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile.id,
          token: verificationCode,
          secret: secret
        })
      });

      if (!response.ok) {
        throw new Error('Nieprawidłowy kod weryfikacyjny');
      }

      const data = await response.json();
      
      if (data.verified) {
        setSuccess('Dwuskładnikowe uwierzytelnianie zostało włączone!');
        setShowBackupCodes(true);
        onTwoFactorToggled();
      } else {
        setError('Nieprawidłowy kod weryfikacyjny');
      }
    } catch (error: any) {
      setError(error.message || 'Wystąpił błąd podczas weryfikacji kodu');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Kod weryfikacyjny musi mieć 6 cyfr');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disable-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile.id,
          token: disableCode
        })
      });

      if (!response.ok) {
        throw new Error('Nieprawidłowy kod weryfikacyjny');
      }

      const data = await response.json();
      
      if (data.disabled) {
        setSuccess('Dwuskładnikowe uwierzytelnianie zostało wyłączone');
        onTwoFactorToggled();
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError('Nieprawidłowy kod weryfikacyjny');
      }
    } catch (error: any) {
      setError(error.message || 'Wystąpił błąd podczas wyłączania 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetForm = () => {
    setStep('setup');
    setQrCodeUrl('');
    setSecret('');
    setVerificationCode('');
    setDisableCode('');
    setBackupCodes([]);
    setShowBackupCodes(false);
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 'disable' ? 'Wyłącz 2FA' : 'Dwuskładnikowe uwierzytelnianie'}
              </h2>
              <p className="text-sm text-gray-600">
                {step === 'disable' ? 'Wyłącz dodatkowe zabezpieczenie' : 'Zwiększ bezpieczeństwo konta'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Błąd</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Sukces</h4>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Setup Step */}
          {step === 'setup' && !showBackupCodes && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Konfiguracja 2FA
                </h3>
                <p className="text-sm text-gray-600">
                  Zeskanuj kod QR w aplikacji Google Authenticator lub podobnej
                </p>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="text-center">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Zeskanuj ten kod w aplikacji uwierzytelniającej
                  </p>
                </div>
              )}

              {/* Manual Entry */}
              {secret && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Lub wprowadź ręcznie:
                  </h4>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <code className="text-sm font-mono text-gray-800 break-all">{secret}</code>
                    <button
                      onClick={() => copyToClipboard(secret)}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kod weryfikacyjny z aplikacji
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wprowadź 6-cyfrowy kod z aplikacji uwierzytelniającej
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Instrukcje:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Pobierz Google Authenticator lub podobną aplikację</li>
                  <li>Zeskanuj kod QR lub wprowadź klucz ręcznie</li>
                  <li>Wprowadź 6-cyfrowy kod z aplikacji</li>
                  <li>Kliknij "Włącz 2FA"</li>
                </ol>
              </div>

              <button
                onClick={verifyAndEnable2FA}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Weryfikowanie...
                  </div>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2 inline" />
                    Włącz 2FA
                  </>
                )}
              </button>
            </div>
          )}

          {/* Backup Codes Display */}
          {showBackupCodes && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2FA zostało włączone!
                </h3>
                <p className="text-sm text-gray-600">
                  Zapisz poniższe kody zapasowe w bezpiecznym miejscu
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-3 flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Kody zapasowe (użyj gdy nie masz dostępu do telefonu):
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white border border-yellow-300 rounded p-2 text-center">
                      <code className="text-sm font-mono text-gray-800">{code}</code>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Skopiuj wszystkie kody
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Ważne:</strong> Zapisz te kody w bezpiecznym miejscu. 
                  Każdy kod można użyć tylko raz. Bez nich nie będziesz mógł się zalogować, 
                  jeśli stracisz dostęp do aplikacji uwierzytelniającej.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Zakończ konfigurację
              </button>
            </div>
          )}

          {/* Disable Step */}
          {step === 'disable' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Wyłącz 2FA
                </h3>
                <p className="text-sm text-gray-600">
                  Wprowadź kod z aplikacji uwierzytelniającej, aby wyłączyć 2FA
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Uwaga:</strong> Wyłączenie 2FA zmniejszy bezpieczeństwo Twojego konta. 
                  Upewnij się, że to naprawdę chcesz zrobić.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kod weryfikacyjny z aplikacji
                </label>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={disable2FA}
                  disabled={loading || disableCode.length !== 6}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? 'Wyłączanie...' : 'Wyłącz 2FA'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetupModal;