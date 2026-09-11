import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Input, Select, Field, Alert } from '../../design-system';
import ChipButton from '../../components/ChipButton.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';

const ROLES = [
  { value: 'CITIZEN', label: 'Community member', icon: 'user' },
  { value: 'DIVER', label: 'Volunteer diver', icon: 'anchor' },
  { value: 'ORGANIZATION', label: 'Organisation', icon: 'building-2' },
];

const PROVINCES = [
  'Western Province',
  'Southern Province',
  'Eastern Province',
  'Northern Province',
  'North Western Province',
];

const CERTIFICATIONS = [
  { value: 'OPEN_WATER', label: 'Open Water' },
  { value: 'ADVANCED_OPEN_WATER', label: 'Advanced Open Water' },
  { value: 'RESCUE_DIVER', label: 'Rescue Diver' },
  { value: 'DIVEMASTER', label: 'Divemaster' },
  { value: 'INSTRUCTOR', label: 'Instructor' },
];

const ORGANIZATION_TYPES = [
  { value: 'NGO', label: 'NGO' },
  { value: 'TOURISM', label: 'Tourism operator' },
  { value: 'MARINE_INSTITUTION', label: 'Marine institution' },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = React.useState('DIVER');
  const [form, setForm] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    password: '',
    certificationLevel: '',
    organizationName: '',
    organizationType: '',
  });
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        role,
        province: form.province || null,
        certificationLevel: role === 'DIVER' ? form.certificationLevel || null : null,
        organizationName: role === 'ORGANIZATION' ? form.organizationName || null : null,
        organizationType: role === 'ORGANIZATION' ? form.organizationType || null : null,
      });
      navigate(role === 'ORGANIZATION' ? '/app/opportunities' : '/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-page-warm)', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
          <span style={{ font: '700 20px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Tideline</span>
        </div>

        <Card padding="lg">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Create your account</h1>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                Join citizens, divers and organisations protecting the coast.
              </p>
            </div>

            {error ? <Alert tone="danger" title="Could not create your account">{error}</Alert> : null}

            <Field label="I am registering as">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ROLES.map((r) => (
                  <ChipButton key={r.value} icon={r.icon} selected={role === r.value} onClick={() => setRole(r.value)}>
                    {r.label}
                  </ChipButton>
                ))}
              </div>
            </Field>

            <Input label="Full name" placeholder="e.g. Sanduni Perera" required value={form.fullName} onChange={set('fullName')} />
            <Input label="Email" type="email" placeholder="you@example.lk" required value={form.email} onChange={set('email')} />
            <Input label="Phone" type="tel" placeholder="+94 7X XXX XXXX" value={form.phone} onChange={set('phone')} />
            <Select label="Province" placeholder="Select your province" options={PROVINCES} value={form.province} onChange={set('province')} />

            {role === 'DIVER' ? (
              <Select
                label="Certification level"
                placeholder="Select certification"
                options={CERTIFICATIONS}
                value={form.certificationLevel}
                onChange={set('certificationLevel')}
                hint="You can add experience and equipment details later in your profile."
              />
            ) : null}

            {role === 'ORGANIZATION' ? (
              <>
                <Input label="Organisation name" placeholder="e.g. Blue Resurgence NGO" value={form.organizationName} onChange={set('organizationName')} />
                <Select label="Organisation type" placeholder="Select type" options={ORGANIZATION_TYPES} value={form.organizationType} onChange={set('organizationType')} />
              </>
            ) : null}

            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
            />

            <Button type="submit" fullWidth size="lg" loading={busy} disabled={busy}>
              {busy ? 'Creating your account…' : 'Create account'}
            </Button>

            <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
