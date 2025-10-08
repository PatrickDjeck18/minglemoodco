import React, { useState } from 'react';
import { X, AlertCircle, Mail, ArrowLeft, CheckCircle, Shield, Smartphone } from 'lucide-react';
import { signInWithSupabase } from '../lib/supabaseAuth';
import { supabase } from '../lib/supabase';

interface SimpleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { role: 'admin' | 'participant'; email: string }) => void;
}

const SimpleLoginModal: React.FC<SimpleLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'reset' | '2fa'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Błąd wysyłania emaila resetującego');
      }

      setResetSuccess(data.message);
      console.log('✅ Password reset email sent successfully');
      
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError(error.message || 'Wystąpił błąd podczas wysyłania emaila resetującego.');
    }
    
    setResetLoading(false);
  };

  const handleTwoFactorVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setTwoFactorError('');

    try {
      if (!pendingAuth) {
        throw new Error('Brak danych uwierzytelniania');
      }

      // Verify 2FA token
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-2fa-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingAuth.email,
          token: twoFactorCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Błąd weryfikacji 2FA';
        console.error('2FA verification error:', errorMessage);
        setTwoFactorError(errorMessage);
        return;
      }

      const data = await response.json();
      
      if (data.verified) {
        // 2FA verified, complete login
        onLogin({ role: data.role, email: pendingAuth.email });
        onClose();
        // Reset form
        setEmail('');
        setPassword('');
        setTwoFactorCode('');
        setPendingAuth(null);
        setMode('login');
      } else {
        setTwoFactorError('Nieprawidłowy kod weryfikacyjny');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error.message || error);
      setTwoFactorError(error.message || 'Wystąpił błąd podczas weryfikacji 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode('login');
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
    setResetToken('');
    setTwoFactorCode('');
    setTwoFactorError('');
    setPendingAuth(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Starting login process for:', email);
      const result = await signInWithSupabase(email, password);
      
      if (result.success) {
        console.log('✅ Auth successful, checking profile...');
        
        // Check if user has 2FA enabled
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('two_factor_enabled, role, id, email')
          .eq('email', email)
          .single();

        if (profileError) {
          console.error('Error checking 2FA status:', profileError);
          setError('Błąd ładowania profilu użytkownika');
          setLoading(false);
          return;
        } else if (profile.two_factor_enabled) {
          console.log('🔐 2FA enabled, showing verification...');
          // User has 2FA enabled, show 2FA verification
          setPendingAuth({ email, password });
          setMode('2fa');
          setLoading(false);
        } else {
          console.log('✅ Login complete, role:', profile.role);
          // No 2FA, proceed with login
          onLogin({ role: profile.role, email });
          onClose();
          // Reset form
          setEmail('');
          setPassword('');
          setError('');
          setLoading(false);
        }
      } else {
        console.error('❌ Auth failed:', result.error);
        setError(result.error || 'Nieprawidłowy email lub hasło');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center">
            {mode === 'reset' && (
              <button
                onClick={handleBackToLogin}
                className="mr-3 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Panel Kursanta' : 'Reset hasła'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'login' ? (
            <>
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Zaloguj się do swojego konta
                </h3>
                <p className="text-gray-600 text-sm">
                  Wybierz sposób logowania, aby uzyskać dostęp do swoich kursów
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Demo Info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">
                  <strong>Demo logowanie:</strong><br />
                  Admin: adam.homoncik@centrumaudytu.pl<br />
                  Participant: test@example.com<br />
                  Hasło: min. 6 znaków
                </p>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adres email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="twoj@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Hasło
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Minimum 6 znaków"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    Zapomniałeś hasła?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                >
                  {loading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
              </form>
            </>
          ) : mode === 'reset' ? (
            <>
              {/* Password Reset Form */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Reset hasła
                </h3>
                <p className="text-gray-600 text-sm">
                  Podaj swój adres email, aby otrzymać token resetu hasła
                </p>
              </div>

              {/* Error Message */}
              {resetError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{resetError}</span>
                </div>
              )}

              {/* Success Message with Token */}
              {resetSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 text-sm font-medium">Email wysłany!</span>
                  </div>
                  <p className="text-sm text-green-700">{resetSuccess}</p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-blue-800 font-medium text-sm">Sprawdź swoją skrzynkę odbiorczą</span>
                    </div>
                    <p className="text-blue-700 text-xs mt-1">
                      Link resetujący hasło jest ważny przez 30 minut.
                    </p>
                  </div>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Adres email
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="twoj@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {resetLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generowanie tokenu...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Wygeneruj token resetu
                    </>
                  )}
                </button>
              </form>

              {/* Security Info */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">
                  <strong>🔒 Bezpieczeństwo:</strong><br />
                  Link resetujący będzie ważny przez 30 minut i może być użyty tylko raz.
                  Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
                </p>
              </div>
            </>
          ) : mode === '2fa' ? (
            <>
              {/* 2FA Verification Form */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Weryfikacja dwuskładnikowa
                </h3>
                <p className="text-gray-600 text-sm">
                  Wprowadź 6-cyfrowy kod z aplikacji Google Authenticator
                </p>
              </div>

              {/* Error Message */}
              {twoFactorError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{twoFactorError}</span>
                </div>
              )}

              {/* 2FA Form */}
              <form onSubmit={handleTwoFactorVerification} className="space-y-6">
                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Kod weryfikacyjny
                  </label>
                  <input
                    type="text"
                    id="twoFactorCode"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Wprowadź kod z aplikacji Google Authenticator
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={twoFactorLoading || twoFactorCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {twoFactorLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Weryfikowanie...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Zweryfikuj i zaloguj
                    </>
                  )}
                </button>
              </form>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Smartphone className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">Instrukcje:</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside ml-4">
                  <li>Otwórz aplikację Google Authenticator</li>
                  <li>Znajdź wpis "Centrum Audytu"</li>
                  <li>Wprowadź aktualny 6-cyfrowy kod</li>
                </ul>
              </div>

              {/* Back to login */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  ← Powrót do logowania
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SimpleLoginModal;