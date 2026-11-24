import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import AppointmentModal from './components/AppointmentModal';
import HomePage from './pages/HomePage';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './styles/bright-smile.css';
import './styles/animations.css';

function App() {
  const { loading } = useAuth();
  const [page, setPage] = useState('home');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ service: null, doctor: null });

  // Start every page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const openModal = (initialService = null, initialDoctor = null) => {
    // If called directly from an event handler where first argument is synthetic event
    const service = typeof initialService === 'string' ? initialService : null;
    const doctor = typeof initialDoctor === 'string' ? initialDoctor : null;
    setModalConfig({ service, doctor });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="app-splash-screen" role="status" aria-label="Loading Bright Smile Dental">
        <div className="app-splash-content">
          <div className="app-splash-icon-pulse">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1597a5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div className="app-splash-brand">Bright Smile Dental</div>
          <div className="app-splash-bar">
            <div className="app-splash-progress" />
          </div>
        </div>
      </div>
    );
  }

  const shared = { onNavigate: setPage, onOpenModal: openModal };

  const renderPage = () => {
    switch (page) {
      case 'about':
        return <About {...shared} />;
      case 'services':
        return <Services {...shared} />;
      case 'contact':
        return <Contact {...shared} />;
      case 'login':
        return <LoginPage onNavigate={setPage} />;
      case 'register':
        return <RegisterPage onNavigate={setPage} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={setPage} />;
      case 'dashboard':
        return <PatientDashboard {...shared} />;
      case 'admin':
        return <AdminDashboard onNavigate={setPage} />;
      default:
        return <HomePage {...shared} />;
    }
  };

  const isAuthPage = page === 'login' || page === 'register' || page === 'forgot-password';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar page={page} onNavigate={setPage} onOpenModal={openModal} />

      <main key={page} className="page-transition" style={{ flex: 1 }}>{renderPage()}</main>

      {!isAuthPage && <Footer onNavigate={setPage} />}

      {/* Mounted once so it stays fixed in the corner on every page */}
      {!isAuthPage && <ChatWidget onOpenModal={openModal} />}
      {!isAuthPage && <ScrollToTop />}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialService={modalConfig.service}
        initialDoctor={modalConfig.doctor}
      />
    </div>
  );
}

export default App;
