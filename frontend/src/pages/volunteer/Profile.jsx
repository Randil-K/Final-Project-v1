import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Input, Select, Switch, Tag, Icon } from '../../design-system';
import { currentUser } from '../../data/mock.js';

export default function Profile() {
  const navigate = useNavigate();
  const [available, setAvailable] = React.useState(currentUser.diver.available);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Avatar name={currentUser.name} role="diver" size="lg" />
        <div>
          <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{currentUser.name}</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <Badge tone="accent" icon="anchor">Volunteer diver</Badge>
          </div>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Contact &amp; location</span>
        <Input label="Full name" defaultValue={currentUser.name} />
        <Input label="Email" type="email" defaultValue={currentUser.email} />
        <Input label="Phone" type="tel" defaultValue={currentUser.phone} />
        <Input label="Current location" iconLeft="map-pin" defaultValue={currentUser.location} />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Diving profile</span>
        <Select label="Certification level" defaultValue="Advanced Open Water" options={['Open Water', 'Advanced Open Water', 'Rescue Diver', 'Divemaster', 'Instructor']} />
        <Input label="Experience" defaultValue={currentUser.diver.experience} />
        <Input label="Equipment available" defaultValue={currentUser.diver.equipment} />
        <div>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)', display: 'block', marginBottom: 8 }}>Preferred working regions</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentUser.diver.regions.map((r) => (
              <Tag key={r} icon="map-pin">{r}</Tag>
            ))}
            <Tag icon="plus">Add region</Tag>
          </div>
        </div>
        <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
          <Switch label="Available for cleanup alerts" hint="Turn off if you don't want to be notified for new assignments right now." checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Volunteer history</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
          <Icon name="check-check" size="sm" color="var(--status-verified)" />
          6 cleanup projects completed · 3 reports submitted
        </div>
      </section>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button fullWidth>Save changes</Button>
        <Button variant="secondary" iconLeft="log-out" onClick={() => navigate('/')}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
