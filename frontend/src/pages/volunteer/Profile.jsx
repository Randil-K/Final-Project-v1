import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Input, Select, Switch, Tag, Icon, Alert } from '../../design-system';
import { api } from '../../api/index.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { CERTIFICATION_LABEL, ROLE_LABEL } from '../../lib/format.js';

const PROVINCES = [
  'Western Province',
  'Southern Province',
  'Eastern Province',
  'Northern Province',
  'North Western Province',
];

const CERTIFICATIONS = Object.entries(CERTIFICATION_LABEL).map(([value, label]) => ({ value, label }));

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [form, setForm] = React.useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    province: user?.province || '',
    city: user?.city || '',
  });
  const [diver, setDiver] = React.useState({
    certificationLevel: user?.diverProfile?.certificationLevel || '',
    experienceYears: user?.diverProfile?.experienceYears ?? '',
    equipment: user?.diverProfile?.equipment || '',
  });
  const [available, setAvailable] = React.useState(user?.availableForAlerts ?? true);
  const [status, setStatus] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const isDiver = user?.role === 'DIVER';
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const setDiverField = (key) => (event) => setDiver((d) => ({ ...d, [key]: event.target.value }));

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      let updated = await api.users.updateProfile({ ...form, availableForAlerts: available });
      if (isDiver) {
        updated = await api.users.updateDiverProfile({
          certificationLevel: diver.certificationLevel || null,
          experienceYears: diver.experienceYears === '' ? null : Number(diver.experienceYears),
          equipment: diver.equipment || null,
        });
      }
      setUser(updated);
      setStatus({ tone: 'success', message: 'Your profile is up to date.' });
    } catch (error) {
      setStatus({ tone: 'danger', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    logout();
    navigate('/');
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Avatar name={user.fullName} role={isDiver ? 'diver' : undefined} size="lg" />
        <div>
          <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{user.fullName}</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <Badge tone="accent" icon={isDiver ? 'anchor' : 'user'}>{ROLE_LABEL[user.role] || user.role}</Badge>
          </div>
        </div>
      </div>

      {status ? <Alert tone={status.tone} title={status.tone === 'success' ? 'Saved' : "That didn't save"}>{status.message}</Alert> : null}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Contact &amp; location</span>
        <Input label="Full name" value={form.fullName} onChange={set('fullName')} />
        <Input label="Email" type="email" value={user.email} disabled hint="Your email is the account identifier and cannot be changed here." />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
        <Input label="City or town" iconLeft="map-pin" value={form.city} onChange={set('city')} />
        <Select label="Province" placeholder="Select your province" options={PROVINCES} value={form.province} onChange={set('province')} />
      </section>

      {isDiver ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Diving profile</span>
          <Select label="Certification level" placeholder="Select certification" options={CERTIFICATIONS} value={diver.certificationLevel} onChange={setDiverField('certificationLevel')} />
          <Input label="Experience (years)" type="number" min="0" value={diver.experienceYears} onChange={setDiverField('experienceYears')} />
          <Input label="Equipment available" value={diver.equipment} onChange={setDiverField('equipment')} />

          {user.diverProfile?.preferredRegions?.length ? (
            <div>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)', display: 'block', marginBottom: 8 }}>Preferred working regions</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {user.diverProfile.preferredRegions.map((region) => (
                  <Tag key={region} icon="map-pin">{region}</Tag>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
        <Switch
          label="Available for cleanup alerts"
          hint="Turn off if you don't want to be notified for new assignments right now."
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
        />
      </div>

      {isDiver ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Volunteer history</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
            <Icon name="check-check" size="sm" color="var(--status-verified)" />
            {user.diverProfile?.completedProjects ?? 0} cleanup project
            {(user.diverProfile?.completedProjects ?? 0) === 1 ? '' : 's'} completed
          </div>
        </section>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button fullWidth onClick={save} loading={busy} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
        <Button variant="secondary" iconLeft="log-out" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
