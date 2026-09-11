import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StatusBadge, Badge, Avatar } from '../../design-system';
import ChipButton from '../../components/ChipButton.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Async } from '../../components/AsyncState.jsx';
import { formatDate, statusKey } from '../../lib/format.js';

const FILTERS = [
  { value: 'all', label: 'All reports' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFYING', label: 'Verifying' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'REJECTED', label: 'Rejected' },
];

const COLUMNS = '100px 1fr 160px 120px 110px 90px';

export default function Queue() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('all');
  const state = useApi(() => api.reports.list({ status: filter, size: 50 }), [filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Review queue</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Reports needing moderation, escalation, or below the community threshold.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <ChipButton key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </ChipButton>
        ))}
      </div>

      <Async
        state={state}
        isEmpty={(data) => !data?.content?.length}
        empty="Nothing in this queue — try another status filter."
        emptyIcon="list-filter"
      >
        {(data) => (
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, padding: '10px var(--space-4)', background: 'var(--surface-sunken)', font: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>
              <span>Ref</span>
              <span>Report</span>
              <span>Location</span>
              <span>Status</span>
              <span>Trust</span>
              <span>Reported</span>
            </div>

            {data.content.map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/console/reports/${report.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: COLUMNS,
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  borderTop: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  font: 'var(--text-body-sm)',
                }}
              >
                <span style={{ font: '600 12px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.reference}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar name={report.reporter?.fullName || ''} size="xs" />
                  <span style={{ color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.title}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                  <Icon name="map-pin" size="xs" />
                  {report.locationName}
                </span>
                <StatusBadge status={statusKey(report.status)} size="sm" />
                <Badge tone={report.trustPercentage >= report.thresholdPercent ? 'success' : 'warning'} size="sm">
                  {report.trustPercentage}%
                </Badge>
                <span style={{ color: 'var(--text-muted)', font: 'var(--text-caption)' }}>
                  {formatDate(report.createdAt, false)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}
