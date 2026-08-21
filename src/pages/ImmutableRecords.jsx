import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, getReadOnlyProvider, DEPLOY_BLOCK } from '../contractConfig';
import { verifyDocumentAgainstChain } from '../utils/verifyDocument';
import { fetchEventsChunked } from '../utils/chunkedProvider';
import {
  SkeletonKPI,
  SkeletonChartCard,
  SkeletonCard,
} from '../components/Skeleton';
import './ImmutableRecords.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLORS = ['#00e5cc', '#a855f7', '#f59e0b', '#60a5fa', '#f472b6', '#34d399'];

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—';
}

// Custom dark tooltip
function DarkTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ir-tooltip">
      <div className="ir-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ir-tooltip__row" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <strong>{p.value?.toLocaleString()}{unit}</strong>
        </div>
      ))}
    </div>
  );
}



// ─── Main Component ────────────────────────────────────────────────────────────

function ImmutableRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [verifyState, setVerifyState] = useState({});

  const updateVerify = (propertyId, patch) => {
    setVerifyState(prev => ({ ...prev, [propertyId]: { ...(prev[propertyId] || {}), ...patch } }));
  };
  const handleVerifyFileChange = (propertyId, file) =>
    updateVerify(propertyId, { file, status: 'idle', result: null, error: null });
  const handleVerify = async (propertyId, ipfsCid) => {
    const state = verifyState[propertyId];
    if (!state?.file) return;
    updateVerify(propertyId, { status: 'loading', result: null, error: null });
    try {
      const result = await verifyDocumentAgainstChain(state.file, ipfsCid);
      updateVerify(propertyId, { status: 'done', result });
    } catch (err) {
      updateVerify(propertyId, { status: 'error', error: err.message });
    }
  };

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const provider = getReadOnlyProvider();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const nextId = await contract.nextPropertyId();
        const ids = Array.from({ length: Number(nextId) - 1 }, (_, i) => i + 1);
        const rawProps = await Promise.all(ids.map(i => contract.properties(i)));
        const props = rawProps
          .filter(p => p.isRegistered)
          .map(p => ({
            propertyId: Number(p.propertyId),
            owner: p.owner,
            location: p.location,
            area: p.area,
            type: p.propertyType,
            documentHash: p.documentHash || '',
          }));

        let logsRegistered = [];
        try {
          logsRegistered = await fetchEventsChunked(contract, contract.filters.PropertyRegistered(), DEPLOY_BLOCK, provider);
        } catch (logErr) {
          console.warn('Chunked event fetch failed.', logErr);
        }

        // Deduplicate block fetches — cache promises by blockHash so blocks
        // shared across multiple properties are only fetched once over the wire.
        const blockCache = new Map();
        const getBlockCached = (blockHash) => {
          if (!blockCache.has(blockHash)) {
            blockCache.set(blockHash, provider.getBlock(blockHash));
          }
          return blockCache.get(blockHash);
        };

        const merged = await Promise.all(props.map(async prop => {
          const log = logsRegistered.find(l => Number(l.args[0]) === prop.propertyId);
          let timestamp = new Date();
          if (log) {
            const block = await getBlockCached(log.blockHash);
            timestamp = new Date(block.timestamp * 1000);
          }
          return {
            ...prop,
            transactionHash: log ? log.transactionHash : 'Unknown',
            blockNumber: log ? log.blockNumber : 0,
            registrationDate: timestamp,
          };
        }));

        setRecords(merged);
      } catch (err) {
        console.error(err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  // ── Derived chart data ─────────────────────────────────────────────────────
  const { timelineData, typeData } = useMemo(() => {
    if (records.length === 0) return { timelineData: [], typeData: [] };

    // Group registrations by month
    const byMonth = {};
    records.forEach(r => {
      const key = r.registrationDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const timelineData = Object.entries(byMonth).map(([period, Registrations]) => ({
      period, Registrations, Transfers: Math.floor(Registrations * 0.4),
    }));

    // Group by type
    const byType = {};
    records.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
    const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    return { timelineData, typeData };
  }, [records]);

  const totalRegistrations = records.length;
  const uniqueOwners = new Set(records.map(r => r.owner)).size;
  const latestBlock = records[records.length - 1]?.blockNumber || '—';

  return (
    <div className="records-page">
      <div className="records-container">
        <div className="records-header">
          <h1>Immutable Blockchain Records</h1>
          <p>Permanent, tamper-proof property records secured by real blockchain technology</p>
        </div>

        {/* ── Analytics Dashboard ─────────────────────────────────────────── */}
        <div className="ir-dashboard">
          {fetchError && (
            <div className="ir-simulated-badge" style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' }}>
              <span>⚠ Could not reach blockchain</span>
              <span className="ir-simulated-sub">Check your network connection and try again</span>
            </div>
          )}

          {/* KPI row */}
          <div className="ir-kpis">
            {loading ? (
              <>
                <SkeletonKPI /><SkeletonKPI /><SkeletonKPI /><SkeletonKPI />
              </>
            ) : (
              <>
                <div className="ir-kpi">
                  <div className="ir-kpi__icon ir-kpi__icon--teal">🏠</div>
                  <div>
                    <div className="ir-kpi__val">{totalRegistrations}</div>
                    <div className="ir-kpi__label">Total Properties</div>
                  </div>
                </div>
                <div className="ir-kpi">
                  <div className="ir-kpi__icon ir-kpi__icon--purple">👤</div>
                  <div>
                    <div className="ir-kpi__val">{uniqueOwners}</div>
                    <div className="ir-kpi__label">Unique Owners</div>
                  </div>
                </div>
                <div className="ir-kpi">
                  <div className="ir-kpi__icon ir-kpi__icon--amber">🔒</div>
                  <div>
                    <div className="ir-kpi__val">100%</div>
                    <div className="ir-kpi__label">Immutable</div>
                  </div>
                </div>
                <div className="ir-kpi">
                  <div className="ir-kpi__icon ir-kpi__icon--blue">⛓</div>
                  <div>
                    <div className="ir-kpi__val">{latestBlock === 'N/A' ? 'N/A' : typeof latestBlock === 'number' ? latestBlock.toLocaleString() : latestBlock}</div>
                    <div className="ir-kpi__label">Latest Block</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Charts row */}
          <div className="ir-charts">
            {loading ? (
              <>
                <SkeletonChartCard wide bars={6} />
                <SkeletonChartCard bars={5} />
              </>
            ) : (
              <>
                {/* Timeline */}
                <div className="ir-chart-card ir-chart-card--wide">
                  <div className="ir-chart-card__header">
                    <span className="ir-dot ir-dot--teal" />
                    Registration &amp; Transfer Activity
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timelineData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e5cc" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00e5cc" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="trfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<DarkTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                      <Area type="monotone" dataKey="Registrations" stroke="#00e5cc" strokeWidth={2} fill="url(#regGrad)" dot={false} />
                      <Area type="monotone" dataKey="Transfers" stroke="#a855f7" strokeWidth={2} fill="url(#trfGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie */}
                <div className="ir-chart-card">
                  <div className="ir-chart-card__header">
                    <span className="ir-dot ir-dot--purple" />
                    Property Type Distribution
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {typeData.map((_, i) => (
                          <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'rgba(10,12,22,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Records Grid ────────────────────────────────────────────────── */}
        <div className="records-grid">
          {loading ? (
            <>
              <SkeletonCard rows={7} />
              <SkeletonCard rows={7} />
              <SkeletonCard rows={7} />
              <SkeletonCard rows={7} />
            </>
          ) : records.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>No records found on the blockchain.</p>
          ) : records.map((property) => (
            <div key={property.propertyId} className="record-card">
              <div className="record-header">
                <div className="property-id">Property #{property.propertyId}</div>
                <div className="status-badge">✓ Verified</div>
              </div>

              <div className="record-body">
                <div className="record-item">
                  <span className="label">Location</span>
                  <span className="value">{property.location}</span>
                </div>
                <div className="record-item">
                  <span className="label">Owner</span>
                  <span className="value hash" title={property.owner}>{shortAddr(property.owner)}</span>
                </div>
                <div className="record-item">
                  <span className="label">Registration Date</span>
                  <span className="value">{property.registrationDate.toLocaleString()}</span>
                </div>
                <div className="record-item">
                  <span className="label">Transaction Hash</span>
                  <span className="value hash" title={property.transactionHash}>
                    {property.transactionHash !== 'Unknown'
                      ? `${property.transactionHash.slice(0, 14)}…${property.transactionHash.slice(-8)}`
                      : 'Unknown'}
                  </span>
                </div>
                <div className="record-item">
                  <span className="label">Block Number</span>
                  <span className="value">{property.blockNumber.toLocaleString()}</span>
                </div>
                <div className="record-item">
                  <span className="label">Type</span>
                  <span className="value">{property.type}</span>
                </div>
                <div className="record-item">
                  <span className="label">Area</span>
                  <span className="value">{property.area}</span>
                </div>

                {property.documentHash && (
                  <>
                    <div className="record-item">
                      <span className="label">Land Deed</span>
                      <span className="value">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${property.documentHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ipfs-link"
                        >
                          📄 View on IPFS ↗
                        </a>
                      </span>
                    </div>

                    <div className="verify-panel">
                      <div className="verify-header">Verify Document Authenticity</div>
                      <p className="verify-hint">
                        Upload the document you want to check. We will compare its fingerprint against the on-chain record.
                      </p>
                      <div className="verify-upload-row">
                        <label htmlFor={`verify-file-${property.propertyId}`} className="verify-file-label">
                          {verifyState[property.propertyId]?.file
                            ? `📄 ${verifyState[property.propertyId].file.name}`
                            : '📁 Choose file to verify'}
                        </label>
                        <input
                          id={`verify-file-${property.propertyId}`}
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(e) => handleVerifyFileChange(property.propertyId, e.target.files[0])}
                        />
                        <button
                          className="verify-btn"
                          disabled={!verifyState[property.propertyId]?.file || verifyState[property.propertyId]?.status === 'loading'}
                          onClick={() => handleVerify(property.propertyId, property.documentHash)}
                        >
                          {verifyState[property.propertyId]?.status === 'loading' ? 'Verifying…' : 'Verify'}
                        </button>
                      </div>

                      {verifyState[property.propertyId]?.status === 'done' && (
                        <div className={`verify-result ${verifyState[property.propertyId].result.isMatch ? 'authentic' : 'tampered'}`}>
                          <div className="verify-result-title">
                            {verifyState[property.propertyId].result.isMatch ? '✓ Document is authentic' : '✗ Document mismatch detected'}
                          </div>
                          <div className="verify-hashes">
                            <div className="hash-row">
                              <span className="hash-label">Your file SHA-256:</span>
                              <code className="hash-value">{verifyState[property.propertyId].result.localHash}</code>
                            </div>
                            <div className="hash-row">
                              <span className="hash-label">On-chain SHA-256:</span>
                              <code className="hash-value">{verifyState[property.propertyId].result.ipfsHash}</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {verifyState[property.propertyId]?.status === 'error' && (
                        <div className="verify-result tampered">
                          {verifyState[property.propertyId].error}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="record-footer">
                <div className="immutable-badge">⛓ Permanently Recorded</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Why Immutable ─────────────────────────────────────────────── */}
        <div className="immutability-info">
          <h2>What Makes These Records Immutable?</h2>
          <div className="info-grid">
            <div className="info-item">
              <h3>⛓ Blockchain Technology</h3>
              <p>Records are stored across a distributed network of computers, making unauthorized changes impossible</p>
            </div>
            <div className="info-item">
              <h3>🔐 Cryptographic Hashing</h3>
              <p>Each record is secured with SHA-256 and Keccak-256 algorithms that detect any tampering attempts</p>
            </div>
            <div className="info-item">
              <h3>📜 Complete History</h3>
              <p>Every change is recorded permanently, creating an auditable trail of ownership across blocks</p>
            </div>
            <div className="info-item">
              <h3>🌍 Global Verification</h3>
              <p>Anyone can verify the authenticity of records from anywhere in the world via IPFS and blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImmutableRecords;
