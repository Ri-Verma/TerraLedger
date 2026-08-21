import React, { useState, useEffect } from 'react';
import './MetaMaskGuide.css';

const STEPS = [
  {
    id: 1,
    icon: '🦊',
    title: 'Install MetaMask',
    summary: 'Add the MetaMask browser extension to your browser',
    detail: 'MetaMask is a free browser extension that acts as your Ethereum wallet. It works with Chrome, Firefox, Brave, and Edge.',
    action: { label: 'Install MetaMask →', url: 'https://metamask.io/download/' },
  },
  {
    id: 2,
    icon: '🔐',
    title: 'Create or Import a Wallet',
    summary: 'Set up your wallet with a new account or existing seed phrase',
    detail: 'After installing, MetaMask will walk you through creating a new wallet. You\'ll receive a 12-word Secret Recovery Phrase — keep this safe and never share it with anyone.',
    action: null,
  },
  {
    id: 3,
    icon: '🌐',
    title: 'Switch to Sepolia Testnet',
    summary: 'TerraLedger runs on the Ethereum Sepolia test network',
    detail: 'Click the network dropdown at the top of MetaMask. Select "Show test networks" and then choose "Sepolia". This is a safe test environment — no real money is involved.',
    action: null,
  },
  {
    id: 4,
    icon: '⛽',
    title: 'Get Free Test ETH',
    summary: 'You need a small amount of Sepolia ETH to pay for gas fees',
    detail: 'Use a free faucet to get Sepolia test ETH sent to your wallet. Click the button below to visit the official Sepolia faucet. Paste your wallet address and request funds.',
    action: { label: 'Open Sepolia Faucet →', url: 'https://sepoliafaucet.com/' },
  },
  {
    id: 5,
    icon: '🔗',
    title: 'Connect Wallet to TerraLedger',
    summary: 'Click "Connect Wallet" in the top navigation bar',
    detail: 'Once on Sepolia with some ETH, click the "Connect Wallet" button in the navbar. MetaMask will ask for your approval — click "Connect" and you\'re in!',
    action: null,
  },
];

const WITH_WALLET = [
  '✅ Register new land properties',
  '✅ Initiate ownership transfers',
  '✅ Sign on-chain transactions',
  '✅ Access Admin & Roles dashboard',
  '✅ Full document verification',
  '✅ View all public records',
];

const WITHOUT_WALLET = [
  '✅ Browse all property records',
  '✅ View transaction history',
  '✅ Search the public registry',
  '✅ Verify document authenticity',
  '❌ Register or transfer property',
  '❌ Admin dashboard access',
];

function MetaMaskGuideModal({ onClose }) {
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  useEffect(() => {
    setHasMetaMask(typeof window.ethereum !== 'undefined');
  }, []);

  const toggleStep = (id) =>
    setExpandedStep((prev) => (prev === id ? null : id));

  const markDone = (e, id) => {
    e.stopPropagation();
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = Math.round((completedSteps.size / STEPS.length) * 100);

  const handleSkip = () => {
    localStorage.setItem('tl_guide_seen', 'true');
    onClose();
  };

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-label="MetaMask Setup Guide">
      <div className="guide-modal">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="guide-header">
          <div className="guide-header__left">
            <div className="guide-fox-icon">🦊</div>
            <div>
              <h2 className="guide-title">Getting Started with TerraLedger</h2>
              <p className="guide-subtitle">Set up MetaMask to unlock the full blockchain land registry experience</p>
            </div>
          </div>
          <button className="guide-close" onClick={handleSkip} aria-label="Close guide">✕</button>
        </div>

        {/* ── Live MetaMask Detection Badge ───────────────────────────── */}
        <div className={`guide-detection ${hasMetaMask ? 'guide-detection--ok' : 'guide-detection--warn'}`}>
          <span className={`guide-detection__pulse ${hasMetaMask ? 'pulse--green' : 'pulse--amber'}`} />
          {hasMetaMask ? (
            <>
              <strong>MetaMask Detected!</strong>
              <span>Great — your wallet extension is already installed. Follow steps 2–5 to connect.</span>
            </>
          ) : (
            <>
              <strong>MetaMask Not Found</strong>
              <span>You can still browse public records without a wallet. Install MetaMask to unlock all features.</span>
            </>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────── */}
        <div className="guide-body">

          {/* Access Mode Comparison */}
          <div className="guide-access-grid">
            <div className="guide-access-card guide-access-card--no">
              <div className="guide-access-card__header">
                <span className="guide-access-icon">👁</span>
                <div>
                  <div className="guide-access-card__title">Without Wallet</div>
                  <div className="guide-access-card__sub">Read-only public access</div>
                </div>
              </div>
              <ul className="guide-access-list">
                {WITHOUT_WALLET.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="guide-access-card guide-access-card--yes">
              <div className="guide-access-card__header">
                <span className="guide-access-icon">🔓</span>
                <div>
                  <div className="guide-access-card__title">With MetaMask</div>
                  <div className="guide-access-card__sub">Full platform access</div>
                </div>
              </div>
              <ul className="guide-access-list">
                {WITH_WALLET.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>

          {/* Step-by-step Setup Guide */}
          <div className="guide-steps-section">
            <div className="guide-steps-header">
              <h3>Setup Guide</h3>
              <div className="guide-progress-wrap">
                <div className="guide-progress-bar">
                  <div className="guide-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="guide-progress-label">{completedSteps.size}/{STEPS.length} done</span>
              </div>
            </div>

            <div className="guide-steps">
              {STEPS.map((step) => {
                const isOpen = expandedStep === step.id;
                const isDone = completedSteps.has(step.id);
                return (
                  <div
                    key={step.id}
                    className={`guide-step ${isOpen ? 'guide-step--open' : ''} ${isDone ? 'guide-step--done' : ''}`}
                  >
                    <button
                      className="guide-step__trigger"
                      onClick={() => toggleStep(step.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="guide-step__left">
                        <div className="guide-step__num">{isDone ? '✓' : step.id}</div>
                        <span className="guide-step__icon">{step.icon}</span>
                        <div className="guide-step__text">
                          <div className="guide-step__title">{step.title}</div>
                          <div className="guide-step__summary">{step.summary}</div>
                        </div>
                      </div>
                      <span className="guide-step__chevron">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="guide-step__body">
                        <p>{step.detail}</p>
                        <div className="guide-step__actions">
                          {step.action && (
                            <a
                              href={step.action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="guide-step__link-btn"
                            >
                              {step.action.label}
                            </a>
                          )}
                          <button
                            className={`guide-step__done-btn ${isDone ? 'guide-step__done-btn--active' : ''}`}
                            onClick={(e) => markDone(e, step.id)}
                          >
                            {isDone ? '✓ Marked Done' : 'Mark as Done'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="guide-footer">
          <p className="guide-footer__note">You can revisit this guide anytime using the <strong>? Guide</strong> button in the navbar.</p>
          <button className="guide-cta" onClick={handleSkip}>
            {hasMetaMask ? 'Got it, let me in →' : 'Continue without wallet →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MetaMaskGuideModal;
