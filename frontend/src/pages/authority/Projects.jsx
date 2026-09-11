import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card, Badge, ProgressBar, Tag } from '../../design-system';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Async } from '../../components/AsyncState.jsx';
import { locationLine } from '../../lib/format.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
];

const STATUS_TONE = { PLANNED: 'neutral', ACTIVE: 'accent', COMPLETED: 'success' };
const STATUS_LABEL = { PLANNED: 'Planned', ACTIVE: 'Active', COMPLETED: 'Completed' };

export default function Projects() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState('all');
  const state = useApi(() => api.projects.list({ status }), [status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Cleanup projects</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Progress tracking from approval to completion.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {FILTERS.map((f) => (
          <Tag key={f.value} selected={status === f.value} onClick={() => setStatus(f.value)}>
            {f.label}
          </Tag>
        ))}
      </div>

      <Async
        state={state}
        isEmpty={(list) => !list?.length}
        empty="No cleanup projects in this state yet."
        emptyIcon="map-pin"
      >
        {(projects) => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {projects.map((p) => (
              <Card key={p.id} interactive onClick={() => navigate(`/console/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ font: '600 12px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{p.reference}</span>
                    <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <h3 style={{ font: 'var(--text-label)', fontSize: 15, color: 'var(--text-strong)' }}>{p.title}</h3>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                    <Icon name="map-pin" size="xs" />
                    {locationLine(p)}
                  </span>
                  <ProgressBar
                    value={p.completionPercentage}
                    valueLabel={`${p.completionPercentage}%`}
                    tone={p.status === 'COMPLETED' ? 'verified' : 'accent'}
                  />
                  <div style={{ display: 'flex', gap: 14, font: 'var(--text-caption)', color: 'var(--text-body-color)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="users" size="xs" />
                      {p.volunteerCount} volunteers
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="anchor" size="xs" />
                      {p.diverCount} divers
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}
