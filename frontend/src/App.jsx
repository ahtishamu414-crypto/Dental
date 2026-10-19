import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
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

function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('home');
  const [modalOpen, setModalOpen] = useState(false);

  // Start every page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#1597a5', fontWeight: 600, fontSize: '1.2rem' }}>
        Loading Bright Smile Dental…
      </div>
    );
  }

  const openModal = () => setModalOpen(true);
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

      <main style={{ flex: 1 }}>{renderPage()}</main>

      {!isAuthPage && <Footer onNavigate={setPage} />}

      {/* Mounted once so it stays fixed in the corner on every page */}
      {!isAuthPage && <ChatWidget />}
      <AppointmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default App;
