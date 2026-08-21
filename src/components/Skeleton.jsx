import React from 'react';
import './Skeleton.css';

/**
 * Skeleton — a single shimmering placeholder block.
 * Drop-in replacement for any piece of loading UI.
 */
export function Skeleton({ width = '100%', height = '1rem', borderRadius = '8px', className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText — stacked shimmer lines that mimic a paragraph.
 * The last line is shorter to look natural.
 */
export function SkeletonText({ lines = 2, lastLineWidth = '65%', gap = '0.5rem', className = '' }) {
  return (
    <div className={`skeleton-text-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.8rem"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonStatCard — mimics a stat/metric card (big number + label).
 */
export function SkeletonStatCard({ className = '' }) {
  return (
    <div className={`skeleton-stat-card ${className}`} aria-hidden="true">
      <Skeleton height="2.4rem" width="50%" borderRadius="8px" style={{ marginBottom: '0.6rem' }} />
      <Skeleton height="0.75rem" width="75%" borderRadius="6px" />
    </div>
  );
}

/**
 * SkeletonCard — mimics a property / record card with multiple label-value rows.
 */
export function SkeletonCard({ rows = 5, className = '' }) {
  return (
    <div className={`skeleton-card ${className}`} aria-hidden="true">
      {/* Card header */}
      <div className="skeleton-card__header">
        <Skeleton height="1rem" width="40%" borderRadius="6px" />
        <Skeleton height="1rem" width="20%" borderRadius="20px" />
      </div>
      {/* Field rows */}
      <div className="skeleton-card__body">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-card__row">
            <Skeleton height="0.75rem" width="25%" borderRadius="4px" />
            <Skeleton height="0.75rem" width={i % 2 === 0 ? '55%' : '45%'} borderRadius="4px" />
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="skeleton-card__footer">
        <Skeleton height="0.75rem" width="35%" borderRadius="20px" />
      </div>
    </div>
  );
}

/**
 * SkeletonTableRow — mimics a table row with N cells.
 */
export function SkeletonTableRow({ cells = 4, className = '' }) {
  const widths = ['8%', '40%', '25%', '12%', '10%'];
  return (
    <tr className={`skeleton-table-row ${className}`} aria-hidden="true">
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i} style={{ padding: '0.9rem 1rem' }}>
          <Skeleton height="0.8rem" width={widths[i] || '30%'} borderRadius="4px" />
        </td>
      ))}
    </tr>
  );
}

/**
 * SkeletonTransactionRow — mimics one item in the transaction history list.
 */
export function SkeletonTransactionRow({ className = '' }) {
  return (
    <div className={`skeleton-tx-row ${className}`} aria-hidden="true">
      <Skeleton height="2.4rem" width="3rem" borderRadius="8px" style={{ flexShrink: 0 }} />
      <div className="skeleton-tx-row__body">
        <Skeleton height="0.9rem" width="45%" borderRadius="4px" style={{ marginBottom: '0.45rem' }} />
        <Skeleton height="0.75rem" width="65%" borderRadius="4px" />
      </div>
      <div className="skeleton-tx-row__end">
        <Skeleton height="0.85rem" width="5rem" borderRadius="20px" style={{ marginBottom: '0.4rem' }} />
        <Skeleton height="0.7rem" width="4rem" borderRadius="4px" />
      </div>
    </div>
  );
}

/**
 * SkeletonPropertyCard — mimics a property card in a grid (Transfer / Search pages).
 */
export function SkeletonPropertyCard({ className = '' }) {
  return (
    <div className={`skeleton-prop-card ${className}`} aria-hidden="true">
      <div className="skeleton-prop-card__top">
        <Skeleton height="0.8rem" width="35%" borderRadius="20px" />
        <Skeleton height="0.8rem" width="25%" borderRadius="20px" />
      </div>
      <Skeleton height="0.85rem" width="80%" borderRadius="4px" style={{ margin: '0.75rem 0 0.5rem' }} />
      <div className="skeleton-prop-card__bottom">
        <Skeleton height="0.75rem" width="35%" borderRadius="4px" />
        <Skeleton height="0.75rem" width="30%" borderRadius="4px" />
      </div>
    </div>
  );
}

/**
 * SkeletonKPI — mimics a KPI/stat card with an icon bubble, big number, and label.
 * Used in ImmutableRecords and AdminTelemetry.
 */
export function SkeletonKPI({ className = '' }) {
  return (
    <div className={`skeleton-kpi ${className}`} aria-hidden="true">
      <Skeleton height="2.5rem" width="2.5rem" borderRadius="50%" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <Skeleton height="1.8rem" width="45%" borderRadius="8px" />
        <Skeleton height="0.7rem" width="70%" borderRadius="4px" />
      </div>
    </div>
  );
}

/**
 * SkeletonChartCard — mimics a chart panel with a header and animated rising bars.
 * The bars use staggered CSS animation delays to look like a live chart rendering.
 * @param {number} bars  — number of animated bar columns to render
 * @param {boolean} wide — if true, applies the wide-card class
 */
export function SkeletonChartCard({ bars = 7, wide = false, className = '' }) {
  return (
    <div className={`skeleton-chart-card ${wide ? 'skeleton-chart-card--wide' : ''} ${className}`} aria-hidden="true">
      {/* Chart card header */}
      <div className="skeleton-chart-card__header">
        <Skeleton height="0.65rem" width="0.65rem" borderRadius="50%" />
        <Skeleton height="0.75rem" width="40%" borderRadius="4px" />
      </div>
      {/* Animated bar chart illusion */}
      <div className="skeleton-chart-bars">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="skeleton-chart-bar"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}
