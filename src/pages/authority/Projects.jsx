import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card, Badge, ProgressBar } from '../../design-system';
import { projects } from '../../data/mock.js';

export default function Projects() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Cleanup projects</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>Progress tracking from approval to completion.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {projects.map((p) => (
          <Card key={p.id} interactive onClick={() => navigate(`/console/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ font: '600 12px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{p.ref}</span>
                <Badge tone={p.status === 'completed' ? 'success' : 'accent'}>{p.status === 'completed' ? 'Completed' : 'Active'}</Badge>
              </div>
              <h3 style={{ font: 'var(--text-label)', fontSize: 15, color: 'var(--text-strong)' }}>{p.title}</h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                <Icon name="map-pin" size="xs" />
                {p.location.name} · {p.location.province}
              </span>
              <ProgressBar value={p.completion} valueLabel={`${p.completion}%`} tone={p.status === 'completed' ? 'verified' : 'accent'} />
              <div style={{ display: 'flex', gap: 14, font: 'var(--text-caption)', color: 'var(--text-body-color)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="users" size="xs" />
                  {p.volunteers} volunteers
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="anchor" size="xs" />
                  {p.divers} divers
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
