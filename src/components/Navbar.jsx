import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useNetwork from '../hooks/useNetwork';
import { useTheme } from '../context/ThemeContext';
import useWalletRoles from '../hooks/useWalletRoles';
import terraLogo from '../icons/SmallSquareLogoJpg.jpg';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { chainId, isCorrectNetwork, networkName, switchToCorrectNetwork } = useNetwork();
  const { theme, toggleTheme } = useTheme();
  const { address: walletAddress, isAdmin: userIsAdmin } = useWalletRoles();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const handleLinkClick = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo" onClick={handleLinkClick}>
          <img src={terraLogo} alt="TerraLedger" className="logo-img" />
          <span className="logo-text">TerraLedger</span>
        </Link>

        <button
          className={`hamburger ${mobileMenuOpen ? 'hamburger--open' : ''}`}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger__line" />
          <span className="hamburger__line" />
          <span className="hamburger__line" />
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'nav-links--open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={handleLinkClick}>
            Dashboard
          </Link>
          <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`} onClick={handleLinkClick}>
            Register
          </Link>
          <Link to="/transfer" className={`nav-link ${isActive('/transfer') ? 'active' : ''}`} onClick={handleLinkClick}>
            Transfer
          </Link>
          <Link to="/records" className={`nav-link ${isActive('/records') ? 'active' : ''}`} onClick={handleLinkClick}>
            Records
          </Link>
          <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`} onClick={handleLinkClick}>
            Search
          </Link>
          <Link to="/transactions" className={`nav-link ${isActive('/transactions') ? 'active' : ''}`} onClick={handleLinkClick}>
            Transactions
          </Link>
          {userIsAdmin && (
            <Link to="/roles" className={`nav-link ${isActive('/roles') ? 'active' : ''}`} onClick={handleLinkClick}>
              Roles
            </Link>
          )}
        </div>

        <div className="navbar-right">
          {chainId !== null && (
            <div
              className={`network-badge ${isCorrectNetwork ? 'network-badge--ok' : 'network-badge--wrong'}`}
              onClick={!isCorrectNetwork ? switchToCorrectNetwork : undefined}
              title={isCorrectNetwork ? `Connected to ${networkName}` : 'Wrong network - click to switch'}
            >
              <span className="network-badge__dot" />
              {isCorrectNetwork ? networkName : 'Wrong Network'}
            </div>
          )}
          <button
            className="guide-nav-btn"
            onClick={() => window.dispatchEvent(new Event('tl:open-guide'))}
            title="Open setup guide"
            aria-label="Open MetaMask setup guide"
          >
            ? Guide
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/wallet" className="wallet-button" onClick={handleLinkClick}>
            <span className="wallet-text">
              {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
