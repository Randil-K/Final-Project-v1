import React from 'react';
import { Icon, Card, Badge, Button, Tag } from '../../design-system';
import { opportunities } from '../../data/mock.js';

export default function Opportunities() {
  const [applied, setApplied] = React.useState({});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Diver opportunities</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>Assignments from NGOs, tourism operators and marine institutions matching your certification.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {opportunities.map((o) => (
          <Card key={o.id} padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{o.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                    <Icon name="building-2" size="xs" />
                    {o.org}
                  </div>
                </div>
                {o.paid ? <Badge tone="success">Paid</Badge> : <Badge tone="neutral">Volunteer</Badge>}
              </div>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>{o.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag icon="map-pin">{o.region}</Tag>
                <Tag icon="badge-check">{o.certRequired}</Tag>
                <Tag icon="building-2">{o.orgType}</Tag>
              </div>
              <Button
                variant={applied[o.id] ? 'soft' : 'primary'}
                disabled={Boolean(applied[o.id])}
                onClick={() => setApplied((a) => ({ ...a, [o.id]: true }))}
                style={{ alignSelf: 'flex-start' }}
              >
                {applied[o.id] ? 'Application sent' : 'Express interest'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
