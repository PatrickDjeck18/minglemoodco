import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Users, Mail } from 'lucide-react';

interface InviteAcceptPageProps {
  token: string;
  onComplete: () => void;
  onAutoLogin?: (userData: { role: 'admin' | 'participant'; email: string; profile?: any }) => void;
}

const InviteAcceptPage: React.FC<InviteAcceptPageProps> = ({ token, onComplete, onAutoLogin }) => {
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      console.log('🔍 Loading invitation for token:', token);
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*, groups(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      console.log('📧 Invitation query result:', { data, error });
      
      if (error) {
        console.error('❌ Database error:', error);
        setError(`Błąd bazy danych: ${error.message}`);
      } else if (!data) {
        setError('Zaproszenie nie istnieje, wygasło lub zostało już wykorzystane');
      } else {
        console.log('✅ Invitation loaded successfully:', data);
        setInvitation(data);
        setAuthData(prev => ({ ...prev, email: data.email }));
      }
    } catch (error) {
      console.error('❌ Error loading invitation:', error);
      setError('Błąd podczas ładowania zaproszenia');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      let authResult = null;

      if (authMode === 'login') {
        console.log('🔐 Attempting login for:', authData.email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });
        
        if (error) {
          console.error('❌ Login error:', error);
          setError(`Błąd logowania: ${error.message}`);
          setProcessing(false);
          return;
        }
        
        authResult = data;
        console.log('✅ Login successful');
      } else {
        console.log('📝 Attempting registration for:', authData.email);
        const { data, error } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
        });
        
        if (error) {
          console.error('❌ Registration error:', error);
          if (error.message.includes('User already registered') || error.message.includes('user_already_exists')) {
            setError('Konto z tym adresem email już istnieje. Przejdź do zakładki "Mam konto" aby się zalogować.');
          } else {
            setError(`Błąd rejestracji: ${error.message}`);
          }
          setProcessing(false);
          return;
        }
        
        authResult = data;
        console.log('✅ Registration successful');
      }

      if (!authResult?.user) {
        setError('Nie udało się zalogować/zarejestrować użytkownika');
        setProcessing(false);
        return;
      }

      const userId = authResult.user.id;
      console.log('👤 User ID:', userId);

      // Create/update profile with group assignment
      console.log('👤 Creating profile for user:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: authData.email,
          first_name: authData.firstName || null,
          last_name: authData.lastName || null,
          group_id: invitation.group_id,
          role: 'participant'
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Profile upsert error:', profileError);
        setError(`Błąd tworzenia/aktualizacji profilu: ${profileError.message}`);
        setProcessing(false);
        return;
      }

      console.log('✅ Profile created/updated successfully');

      // Wait a moment for triggers to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🎉 All steps completed successfully!');
      setSuccess(true);
      
      // Auto-login the user immediately without delay
      console.log('🚀 Triggering auto-login for:', authData.email);
      if (onAutoLogin) {
        onAutoLogin({
          role: 'participant',
          email: authData.email,
          profile: profileData
        });
      }
      
      // Complete after short delay to show success message
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      setError(`Wystąpił nieoczekiwany błąd: ${error.message}`);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie zaproszenia...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zaproszenie zaakceptowane!</h2>
          <p className="text-gray-600 mb-4">
            Zostałeś dodany do grupy <strong>{invitation?.groups?.name}</strong>
          </p>
          <p className="text-sm text-gray-500">Przekierowywanie...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Błąd zaproszenia</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onComplete}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Powrót do strony głównej
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zaproszenie do grupy</h2>
          <p className="text-gray-600">
            Zostałeś zaproszony do grupy <strong>{invitation?.groups?.name}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
              authMode === 'register' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nowe konto
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
              authMode === 'login' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mam konto
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={authData.email}
              onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
              readOnly
            />
          </div>

          {authMode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię
                </label>
                <input
                  type="text"
                  value={authData.firstName}
                  onChange={(e) => setAuthData({ ...authData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Jan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwisko
                </label>
                <input
                  type="text"
                  value={authData.lastName}
                  onChange={(e) => setAuthData({ ...authData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Kowalski"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasło
            </label>
            <input
              type="password"
              required
              value={authData.password}
              onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {processing ? 'Przetwarzanie...' : (authMode === 'login' ? 'Zaloguj się i dołącz' : 'Utwórz konto i dołącz')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Dołączając do grupy, akceptujesz regulamin platformy
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptPage;