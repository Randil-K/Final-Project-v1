import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Button, Tag } from '../../design-system';
import { reports } from '../../data/mock.js';
import ReportCard from '../../components/ReportCard.jsx';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'verified', label: 'Verified' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'cleaned', label: 'Cleaned' },
];

export default function Feed() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState('all');

  const filtered = status === 'all' ? reports : reports.filter((r) => r.status === status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Nearby reports</h1>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>Western Province · 25 km radius</p>
        </div>
        <Button iconLeft="camera" onClick={() => navigate('/app/submit')}>
          Report pollution
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {STATUS_FILTERS.map((f) => (
          <Tag key={f.value} selected={status === f.value} onClick={() => setStatus(f.value)}>
            {f.label}
          </Tag>
        ))}
      </div>

      {filtered.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 'var(--space-16) 0', textAlign: 'center' }}>
          <Icon name="waves-horizontal" size="xl" color="var(--gray-300)" />
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', maxWidth: 280 }}>
            No reports in this status near you yet — widen your radius or report a site.
          </p>
        </div>
      )}
    </div>
  );
}
