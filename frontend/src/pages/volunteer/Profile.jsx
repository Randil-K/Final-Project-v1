import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Input, Select, Switch, Tag, Alert } from '../../design-system';
import ProfileOverview, { DetailRow, DetailSection } from '../../components/ProfileOverview.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ACCOUNT_STATUS, CERTIFICATION_OPTIONS, PROVINCES } from '../../lib/format.js';
import AvatarEditor from '../../components/AvatarEditor.jsx';

function formFrom(user) {
  return {
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    province: user?.province || '',
    city: user?.city || '',
    // Held as text so the fields can be cleared while typing; parsed on save.
    latitude: user?.latitude ?? '',
    longitude: user?.longitude ?? '',
  };
}

/** Empty means "leave it unset"; anything else has to be a number in range. */
function readCoordinates(form) {
  const lat = String(form.latitude).trim();
  const lon = String(form.longitude).trim();
  if (!lat && !lon) return { latitude: null, longitude: null };
  if (!lat || !lon) throw new Error('Enter both a latitude and a longitude, or leave both empty.');

  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Latitude has to be a number between -90 and 90.');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Longitude has to be a number between -180 and 180.');
  }
  return { latitude, longitude };
}

function diverFrom(user) {
  return {
    certificationLevel: user?.diverProfile?.certificationLevel || '',
    experienceYears: user?.diverProfile?.experienceYears ?? '',
    equipment: user?.diverProfile?.equipment || '',
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, logout } = useAuth();
  // "Add my location" on the feed sends people here to do one specific thing, so open the form
  // rather than the read-only overview they would otherwise land on.
  const askedForLocation = new URLSearchParams(location.search).get('edit') === 'location';
  const profileState = useApi(() => (user ? api.users.profile(user.id) : Promise.resolve(null)), [user]);

  const [editing, setEditing] = React.useState(askedForLocation);
  const [form, setForm] = React.useState(() => formFrom(user));
  const [diver, setDiver] = React.useState(() => diverFrom(user));
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

  function startEditing() {
    setForm(formFrom(user));
    setDiver(diverFrom(user));
    setRegions(user?.diverProfile?.preferredRegions || []);
    setAvailable(user?.availableForAlerts ?? true);
    setStatus(null);
    setEditing(true);
  }

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
          const latitude = Number(position.coords.latitude.toFixed(6));
          const longitude = Number(position.coords.longitude.toFixed(6));
          // Show what was captured in the fields too, so it can be checked or corrected.
          setForm((f) => ({ ...f, latitude, longitude }));
          setUser(await api.users.updateProfile({ latitude, longitude }));
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
    let coordinates;
    try {
      coordinates = readCoordinates(form);
    } catch (error) {
      setStatus({ tone: 'warning', title: 'Check your location', message: error.message });
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      let updated = await api.users.updateProfile({ ...form, ...coordinates, availableForAlerts: available });
      if (isDiver) {
        updated = await api.users.updateDiverProfile({
          certificationLevel: diver.certificationLevel || null,
          experienceYears: diver.experienceYears === '' ? null : Number(diver.experienceYears),
          equipment: diver.equipment || null,
          preferredRegions: regions,
        });
      }
      setUser(updated);
      setEditing(false);
      setStatus({ tone: 'success', title: 'Saved', message: 'Your profile is up to date.' });
    } catch (error) {
      setStatus({ tone: 'danger', title: "That didn't save", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    // Leave the protected page before clearing the session.
    navigate('/', { replace: true });
    setTimeout(logout, 0);
  }

  if (!user) return null;

  const statusAlert = status ? (
    <Alert tone={status.tone} title={status.title} onDismiss={() => setStatus(null)}>{status.message}</Alert>
  ) : null;

  if (!editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {statusAlert}
        <Async state={profileState}>
          {(profile) => (
            <ProfileOverview
              profile={profile}
              actions={<Button variant="secondary" iconLeft="settings" onClick={startEditing}>Edit profile</Button>}
              avatar={
                <AvatarEditor
                  user={user}
                  name={user.role === 'ORGANIZATION' && user.organizationName ? user.organizationName : user.fullName}
                  role={isDiver ? 'diver' : undefined}
                  onChange={(updated) => {
                    setUser(updated);
                    setStatus(null);
                  }}
                />
              }
            >
              <DetailSection title="Account">
                <DetailRow icon="user" label="Email">{user.email}</DetailRow>
                <DetailRow icon="message-square" label="Phone">{user.phone || '—'}</DetailRow>
                {isDiver || user.role === 'ORGANIZATION' ? (
                  <DetailRow icon="shield-check" label="Account status">
                    <Badge tone={ACCOUNT_STATUS[user.accountStatus]?.tone} size="sm">{ACCOUNT_STATUS[user.accountStatus]?.label}</Badge>
                  </DetailRow>
                ) : null}
                {isDiver ? <DetailRow icon="life-buoy" label="Equipment">{user.diverProfile?.equipment || '—'}</DetailRow> : null}
                <DetailRow icon="map-pin" label="Alert location">
                  {hasLocation ? (
                    `${user.latitude.toFixed(4)}° N, ${user.longitude.toFixed(4)}° E`
                  ) : (
                    <Button variant="secondary" size="sm" iconLeft="map-pin" onClick={startEditing}>
                      Add my location
                    </Button>
                  )}
                </DetailRow>
                <DetailRow icon="bell" label="Cleanup alerts">{user.availableForAlerts ? 'On' : 'Off'}</DetailRow>
              </DetailSection>
            </ProfileOverview>
          )}
        </Async>

        <Button variant="secondary" iconLeft="log-out" onClick={signOut} style={{ alignSelf: 'flex-start' }}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Edit profile</h1>

      {statusAlert}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Contact details</span>
        <Input label="Full name" value={form.fullName} onChange={set('fullName')} />
        <Input label="Email" type="email" value={user.email} disabled />
        <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
        <Input label="City or town" iconLeft="map-pin" value={form.city} onChange={set('city')} />
        <Select label="Province" placeholder="Select your province" options={PROVINCES} value={form.province} onChange={set('province')} />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Alerts</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
            {hasLocation ? `${user.latitude.toFixed(4)}° N, ${user.longitude.toFixed(4)}° E` : 'No location saved'}
          </span>
          <Button variant="secondary" size="sm" iconLeft="map-pin" onClick={captureLocation} disabled={locating} style={{ alignSelf: 'flex-start' }}>
            {locating ? 'Locating…' : hasLocation ? 'Update to my current location' : 'Use my current location'}
          </Button>

          {/* Typing the coordinates is the fallback when the browser will not share a location,
              and the only way to pick somewhere other than where you happen to be sitting. */}
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 4 }}>
            Or enter the coordinates yourself. Right-click a spot in Google Maps to copy them.
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Input
              label="Latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              placeholder="e.g. 7.2083"
              value={form.latitude}
              onChange={set('latitude')}
              style={{ flex: 1 }}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              placeholder="e.g. 79.8358"
              value={form.longitude}
              onChange={set('longitude')}
              style={{ flex: 1 }}
            />
          </div>
          {form.latitude !== '' || form.longitude !== '' ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft="x"
              onClick={() => setForm((f) => ({ ...f, latitude: '', longitude: '' }))}
              style={{ alignSelf: 'flex-start' }}
            >
              Clear location
            </Button>
          ) : null}
        </div>
        <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
          <Switch label="Available for cleanup alerts" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        </div>
      </section>

      {isDiver ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Diving profile</span>
          <Select label="Certification level" placeholder="Select certification" options={CERTIFICATION_OPTIONS} value={diver.certificationLevel} onChange={setDiverField('certificationLevel')} />
          <Input label="Experience" type="number" min="0" suffix="years" value={diver.experienceYears} onChange={setDiverField('experienceYears')} />
          <Input label="Equipment available" placeholder="e.g. Own BCD, regulator, wetsuit" value={diver.equipment} onChange={setDiverField('equipment')} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Preferred working regions</span>
            {regions.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {regions.map((region) => (
                  <Tag key={region} icon="map-pin" onRemove={() => setRegions((rs) => rs.filter((r) => r !== region))}>
                    {region}
                  </Tag>
                ))}
              </div>
            ) : null}
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

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button fullWidth onClick={save} loading={busy} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
        <Button variant="secondary" onClick={() => { setStatus(null); setEditing(false); }} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
