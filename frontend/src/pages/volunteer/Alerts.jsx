import React from 'react';
import { Icon, Card, Badge } from '../../design-system';
import { alerts } from '../../data/mock.js';

const KIND = {
  project: { icon: 'map-pin', color: 'var(--tide-600)' },
  verified: { icon: 'badge-check', color: 'var(--status-verified)' },
  escalation: { icon: 'flag', color: 'var(--status-escalated)' },
  opportunity: { icon: 'hand-heart', color: 'var(--buoy-600)' },
};

export default function Alerts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Alerts</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>Nearby cleanups, verification results and opportunities.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {alerts.map((a) => {
          const k = KIND[a.kind];
          return (
            <Card key={a.id} padding="md" tone={a.read ? 'default' : 'accent'}>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  <Icon name={k.icon} size="sm" color={k.color} />
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{a.title}</span>
                    {!a.read ? <Badge tone="accent" dot size="sm">New</Badge> : null}
                  </div>
                  <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>{a.body}</p>
                  <span style={{ font: 'var(--text-micro)', color: 'var(--text-muted)' }}>{a.time}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
