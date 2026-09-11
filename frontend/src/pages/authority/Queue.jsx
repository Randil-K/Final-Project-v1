import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StatusBadge, Badge, Tag, Avatar } from '../../design-system';
import { reports, trustPct } from '../../data/mock.js';

const FILTERS = [
  { value: 'all', label: 'All reports' },
  { value: 'pending', label: 'Pending' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'verified', label: 'Verified' },
  { value: 'escalated', label: 'Escalated' },
];

export default function Queue() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('all');
  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Review queue</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>Reports needing moderation, escalation, or below the 75% community threshold.</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {FILTERS.map((f) => (
          <Tag key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Tag>
        ))}
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 120px 110px 90px', padding: '10px var(--space-4)', background: 'var(--surface-sunken)', font: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>
          <span>Ref</span>
          <span>Report</span>
          <span>Location</span>
          <span>Status</span>
          <span>Trust</span>
          <span>Reported</span>
        </div>
        {filtered.map((r) => {
          const pct = trustPct(r);
          return (
            <div
              key={r.id}
              onClick={() => navigate(`/console/reports/${r.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 160px 120px 110px 90px',
                alignItems: 'center',
                padding: 'var(--space-3) var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                font: 'var(--text-body-sm)',
              }}
            >
              <span style={{ font: '600 12px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{r.ref}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Avatar name={r.submittedBy} size="xs" />
                <span style={{ color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                <Icon name="map-pin" size="xs" />
                {r.location.name}
              </span>
              <StatusBadge status={r.status} size="sm" />
              <Badge tone={pct >= 75 ? 'success' : 'warning'} size="sm">{pct}%</Badge>
              <span style={{ color: 'var(--text-muted)', font: 'var(--text-caption)' }}>
                {new Date(r.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
