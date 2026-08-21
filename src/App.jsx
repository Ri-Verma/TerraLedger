import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import NetworkGuard from './components/NetworkGuard';
import Dashboard from './pages/Dashboard';
import RegisterProperty from './pages/RegisterProperty';
import TransferOwnership from './pages/TransferOwnership';
import ImmutableRecords from './pages/ImmutableRecords';
import PropertySearch from './pages/PropertySearch';
import TransactionHistory from './pages/TransactionHistory';
import WalletAuth from './pages/WalletAuth';
import RoleManager from './pages/RoleManager';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import AdminTelemetry from './components/AdminTelemetry';
import MetaMaskGuideModal from './components/MetaMaskGuide';
import './App.css';

function App() {
  // Show guide on first visit; user can dismiss to set localStorage flag.
  // Also exposed as a global so the Navbar '? Guide' button can reopen it.
  const [guideOpen, setGuideOpen] = useState(
    () => localStorage.getItem('tl_guide_seen') !== 'true'
  );

  useEffect(() => {
    // Allow child components (e.g. Navbar) to reopen the guide via custom event
    const handleOpen = () => setGuideOpen(true);
    window.addEventListener('tl:open-guide', handleOpen);
    return () => window.removeEventListener('tl:open-guide', handleOpen);
  }, []);
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          localStorage.setItem('wallet_user_address', accounts[0]);
          window.dispatchEvent(new Event('storage'));
        } else {
          localStorage.removeItem('wallet_connected');
          localStorage.removeItem('wallet_user_address');
          localStorage.removeItem('wallet_is_admin');
          window.dispatchEvent(new Event('storage'));
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <Navbar />
            <NetworkGuard />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/register" element={<RegisterProperty />} />
              <Route path="/transfer" element={<TransferOwnership />} />
              <Route path="/records" element={<ImmutableRecords />} />
              <Route path="/search" element={<PropertySearch />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/wallet" element={<WalletAuth />} />
              <Route path="/roles" element={<RoleManager />} />
            </Routes>
            <AdminTelemetry />
            {guideOpen && <MetaMaskGuideModal onClose={() => setGuideOpen(false)} />}
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
