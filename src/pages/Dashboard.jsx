import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, getReadOnlyProvider, DEPLOY_BLOCK } from '../contractConfig';
import { fetchEventsChunked } from '../utils/chunkedProvider';
import { SkeletonStatCard } from '../components/Skeleton';
import terraLogo from '../icons/SmallSquareLogoJpg.jpg';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    properties: '0',
    transfers: '0',
    security: '100%'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const provider = getReadOnlyProvider();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const nextId = await contract.nextPropertyId();
        const registered = Number(nextId) > 0 ? Number(nextId) - 1 : 0;
        let transfersCount = '0';
        try {
          const filter = contract.filters.OwnershipTransferred();
          const logs = await fetchEventsChunked(contract, filter, DEPLOY_BLOCK, provider);
          transfersCount = logs.length.toString();
        } catch (logErr) {
          console.warn("Chunked transfer log fetch failed.", logErr);
        }

        setStats({
          properties: registered.toString(),
          transfers: transfersCount,
          security: '100%'
        });
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      id: 1,
      title: 'Register Property',
      description: 'Create a verified digital land title with owner, location, area, type, and document hash.',
      path: '/register'
    },
    {
      id: 2,
      title: 'Transfer Ownership',
      description: 'Start owner-led transfers and route approvals through authorized land registrars.',
      path: '/transfer'
    },
    {
      id: 3,
      title: 'Immutable Records',
      description: 'Review permanent blockchain records, block metadata, and IPFS deed references.',
      path: '/records'
    },
    {
      id: 4,
      title: 'Search Registry',
      description: 'Verify a title by property ID, owner wallet address, or registered location.',
      path: '/search'
    },
    {
      id: 5,
      title: 'Audit Transactions',
      description: 'Inspect registrations, transfers, gas usage, blocks, and confirmation status.',
      path: '/transactions'
    },
    {
      id: 6,
      title: 'Wallet Access',
      description: 'Connect a wallet and check role-based permissions for citizens and officials.',
      path: '/wallet'
    }
  ];

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-kicker">Blockchain Based Land Registry for India</div>
          <h1>Transparent land records with verifiable ownership history.</h1>
          <p>
            TerraLedger provides a professional registry workflow for property registration,
            transfers, document verification, and public audit trails secured on blockchain.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => navigate('/search')} className="primary-action">
              Verify Property
            </button>
            <button type="button" onClick={() => navigate('/register')} className="secondary-action">
              Register Title
            </button>
          </div>
        </div>
        <div className="hero-panel" aria-label="Registry overview">
          <div className="hero-panel-header">
            <img src={terraLogo} alt="" className="hero-logo" />
            <div>
              <span>TerraLedger Registry</span>
              <strong>India land title ledger</strong>
            </div>
          </div>
          <div className="hero-stats">
            {statsLoading ? (
              <>
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
              </>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.properties}</div>
                  <div className="stat-label">Registered Properties</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.transfers}</div>
                  <div className="stat-label">Completed Transfers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.security}</div>
                  <div className="stat-label">On-chain Verification</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <h2>Registry Workflows</h2>
          <p>Core tasks are organized around officials, owners, and public verification.</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <button
              key={feature.id}
              type="button"
              className="feature-card"
              onClick={() => navigate(feature.path)}
            >
              <span className="feature-number">{String(feature.id).padStart(2, '0')}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-link">Open workflow</span>
            </button>
          ))}
        </div>
      </section>

      <section className="benefits-section">
        <div className="section-heading">
          <h2>Designed For Public Trust</h2>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>Registrar Oversight</h3>
            <p>Role-controlled workflows keep title creation and approvals with authorized officials.</p>
          </div>
          <div className="benefit-card">
            <h3>Document Integrity</h3>
            <p>IPFS references and hash checks support deed verification without exposing private custody.</p>
          </div>
          <div className="benefit-card">
            <h3>Public Audit Trail</h3>
            <p>Every registration and ownership movement can be traced to a transaction and block.</p>
          </div>
          <div className="benefit-card">
            <h3>Citizen Access</h3>
            <p>Search and verification stay simple for owners, buyers, lenders, and local offices.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
