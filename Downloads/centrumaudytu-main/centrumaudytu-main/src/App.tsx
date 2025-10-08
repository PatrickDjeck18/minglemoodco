import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ContactSection from './components/ContactSection';
import SimpleAdminDashboard from './components/SimpleAdminDashboard';
import SimpleParticipantDashboard from './components/SimpleParticipantDashboard';
import InviteAcceptPage from './components/InviteAcceptPage';
import SimpleLoginModal from './components/SimpleLoginModal';
import PasswordResetPage from './components/PasswordResetPage';

function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ role: 'admin' | 'participant'; email: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check for auto-login after invite acceptance
  React.useEffect(() => {
    const autoLoginData = sessionStorage.getItem('autoLoginUser');
    if (autoLoginData) {
      try {
        const userData = JSON.parse(autoLoginData);
        setUser(userData);
        sessionStorage.removeItem('autoLoginUser');
      } catch (error) {
        console.error('Error parsing auto-login data:', error);
        sessionStorage.removeItem('autoLoginUser');
      }
    }
  }, []);

  // Check for invite token in URL
  React.useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for invite token
    const inviteMatch = path.match(/\/invite\/(.+)/);
    if (inviteMatch) {
      setInviteToken(inviteMatch[1]);
      return;
    }
    
    // Check for reset token
    const resetTokenParam = searchParams.get('token');
    if (path.includes('reset-password') && resetTokenParam) {
      setResetToken(resetTokenParam);
      return;
    }
  }, []);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleLogin = (userData: { role: 'admin' | 'participant'; email: string }) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveSection('home');
    setInviteToken(null);
    window.history.pushState({}, '', '/');
  };

  const handleInviteComplete = () => {
    setInviteToken(null);
    setResetToken(null);
    window.history.pushState({}, '', '/');
  };

  const handleResetComplete = () => {
    setResetToken(null);
    window.history.pushState({}, '', '/');
    setShowLoginModal(true);
  };

  const handleAutoLogin = (userData: { role: 'admin' | 'participant'; email: string; profile?: any }) => {
    console.log('🔄 Auto-login triggered:', userData);
    console.log('🔄 Setting user state:', userData);
    setUser(userData);
    console.log('✅ User state set, should redirect to dashboard');
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  // Show invite acceptance page
  if (inviteToken) {
    return (
      <InviteAcceptPage 
        token={inviteToken} 
        onComplete={handleInviteComplete}
        onAutoLogin={handleAutoLogin}
      />
    );
  }

  // Show password reset page
  if (resetToken) {
    return (
      <PasswordResetPage 
        token={resetToken} 
        onComplete={handleResetComplete}
      />
    );
  }

  // Show dashboard if user is logged in
  if (user) {
    if (user.role === 'admin') {
      return <SimpleAdminDashboard user={user} onLogout={handleLogout} />;
    } else {
      return <SimpleParticipantDashboard user={user} onLogout={handleLogout} />;
    }
  }

  // Show public website
  const renderContent = () => {
    switch (activeSection) {
      case 'kontakt':
        return <ContactSection />;
      case 'polityka':
        return (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                Polityka i Misja
              </h2>
              <p className="text-xl text-gray-600 text-center">
                Zawartość sekcji Polityka i Misja będzie dodana wkrótce.
              </p>
            </div>
          </section>
        );
      case 'szkolenia':
        return (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                Szkolenia
              </h2>
              <p className="text-xl text-gray-600 text-center">
                Zawartość sekcji Szkolenia będzie dodana wkrótce.
              </p>
            </div>
          </section>
        );
      case 'dla-firm':
        return (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                Dla Firm
              </h2>
              <p className="text-xl text-gray-600 text-center">
                Zawartość sekcji Dla Firm będzie dodana wkrótce.
              </p>
            </div>
          </section>
        );
      case 'publiczne':
        return (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                Dla Podmiotów Publicznych
              </h2>
              <p className="text-xl text-gray-600 text-center">
                Zawartość sekcji Dla Podmiotów Publicznych będzie dodana wkrótce.
              </p>
            </div>
          </section>
        );
      case 'cennik':
        return (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                Cennik
              </h2>
              <p className="text-xl text-gray-600 text-center">
                Zawartość sekcji Cennik będzie dodana wkrótce.
              </p>
            </div>
          </section>
        );
      default:
        return (
          <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 min-h-[80vh] flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Centrum Audytu
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wybierz sekcję z menu, aby poznać nasze usługi i ofertę.
              </p>
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onSectionChange={handleSectionChange} 
        activeSection={activeSection}
        onLoginClick={openLoginModal}
      />
      {renderContent()}
      
      <SimpleLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;