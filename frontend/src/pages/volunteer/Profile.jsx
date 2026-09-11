import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Input, Select, Switch, Tag, Icon, Alert } from '../../design-system';
import { api } from '../../api/index.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { CERTIFICATION_OPTIONS, PROVINCES, ROLE_LABEL, plural } from '../../lib/format.js';

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
  const [regions, setRegions] = React.useState(user?.diverProfile?.preferredRegions || []);
  const [available, setAvailable] = React.useState(user?.availableForAlerts ?? true);
  const [status, setStatus] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [locating, setLocating] = React.useState(false);

  const isDiver = user?.role === 'DIVER';
  const hasLocation = user?.latitude != null && user?.longitude != null;
  const remainingRegions = PROVINCES.filter((p) => !regions.includes(p));

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const setDiverField = (key) => (event) => setDiver((d) => ({ ...d, [key]: event.target.value }));

  function captureLocation() {
    setStatus(null);
    if (!navigator.geolocation) {
      setStatus({ tone: 'warning', title: 'Location not saved', message: 'This browser cannot share your location.' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Saved straight away — alerts depend on it, and it's easy to forget the Save button.
          setUser(await api.users.updateProfile({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setStatus({ tone: 'success', title: 'Location saved', message: "You'll get alerts for reports and cleanups within 5 km." });
        } catch (error) {
          setStatus({ tone: 'danger', title: 'Location not saved', message: error.message });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setStatus({ tone: 'warning', title: 'Location not saved', message: 'Location access was blocked. Allow it in your browser settings and try again.' });
      },
      { timeout: 8000 },
    );
  }

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
          preferredRegions: regions,
        });
      }
      setUser(updated);
      setStatus({ tone: 'success', title: 'Saved', message: 'Your profile is up to date.' });
    } catch (error) {
      setStatus({ tone: 'danger', title: "That didn't save", message: error.message });
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
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <Badge tone="accent" icon={isDiver ? 'anchor' : 'user'}>{ROLE_LABEL[user.role] || user.role}</Badge>
            {user.averageMark != null ? (
              <Badge tone="success" icon="badge-check">Rated {user.averageMark} / 5</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {status ? <Alert tone={status.tone} title={status.title} onDismiss={() => setStatus(null)}>{status.message}</Alert> : null}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Alert location</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: hasLocation ? 'var(--surface-sunken)' : 'var(--accent-soft)' }}>
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
            {hasLocation
              ? `Alerts reach you for reports and cleanups within 5 km of ${user.latitude.toFixed(4)}° N, ${user.longitude.toFixed(4)}° E.`
              : "No location saved yet, so you won't hear about pollution near you."}
          </span>
          <Button variant={hasLocation ? 'secondary' : 'primary'} size="sm" iconLeft="map-pin" onClick={captureLocation} disabled={locating} style={{ alignSelf: 'flex-start' }}>
            {locating ? 'Locating…' : hasLocation ? 'Update to my current location' : 'Use my current location'}
          </Button>
        </div>
        <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
          <Switch
            label="Available for cleanup alerts"
            hint="Turn off if you don't want to be notified for new assignments right now."
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Contact details</span>
        <Input label="Full name" value={form.fullName} onChange={set('fullName')} />
        <Input label="Email" type="email" value={user.email} disabled hint="Your email is the account identifier and cannot be changed here." />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
        <Input label="City or town" iconLeft="map-pin" value={form.city} onChange={set('city')} />
        <Select label="Province" placeholder="Select your province" options={PROVINCES} value={form.province} onChange={set('province')} />
      </section>

      {isDiver ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Diving profile</span>
          <Select label="Certification level" placeholder="Select certification" options={CERTIFICATION_OPTIONS} value={diver.certificationLevel} onChange={setDiverField('certificationLevel')} />
          <Input label="Experience" type="number" min="0" suffix="years" value={diver.experienceYears} onChange={setDiverField('experienceYears')} />
          <Input label="Equipment available" placeholder="e.g. Own BCD, regulator, wetsuit" value={diver.equipment} onChange={setDiverField('equipment')} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Preferred working regions</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {regions.map((region) => (
                <Tag key={region} icon="map-pin" onRemove={() => setRegions((rs) => rs.filter((r) => r !== region))}>
                  {region}
                </Tag>
              ))}
              {!regions.length ? (
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  None chosen — you'll hear about opportunities in every region.
                </span>
              ) : null}
            </div>
            {remainingRegions.length ? (
              <Select
                placeholder="Add a region"
                options={remainingRegions}
                value=""
                onChange={(e) => {
                  const region = e.target.value;
                  if (region) setRegions((rs) => [...rs, region]);
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {user.role === 'DIVER' || user.role === 'CITIZEN' ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Volunteer record</span>
          {isDiver ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
              <Icon name="check-check" size="sm" color="var(--status-verified)" />
              {plural(user.diverProfile?.completedProjects ?? 0, 'cleanup project')} completed
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
            <Icon name="badge-check" size="sm" color="var(--accent)" />
            {user.averageMark != null
              ? `Rated ${user.averageMark} / 5 by organisers across ${plural(user.markedCleanups, 'cleanup')}`
              : 'No organiser ratings yet — they appear after your first completed cleanup.'}
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
