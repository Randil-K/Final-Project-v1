import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Input, Select, Field, Alert, Badge } from '../../design-system';
import ChipButton from '../../components/ChipButton.jsx';
import DocumentPicker from '../../components/DocumentPicker.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { CERTIFICATION_OPTIONS, PROVINCES } from '../../lib/format.js';

const ROLES = [
  { value: 'CITIZEN', label: 'Community member', icon: 'user' },
  { value: 'DIVER', label: 'Volunteer diver', icon: 'anchor' },
  { value: 'ORGANIZATION', label: 'Organisation', icon: 'building-2' },
  { value: 'AUTHORITY', label: 'Government officer', icon: 'shield-check' },
  { value: 'ADMIN', label: 'Administrator', icon: 'settings' },
];

const OFFICIAL_ROLES = ['AUTHORITY', 'ADMIN'];
const NEEDS_DOCUMENTS = ['DIVER', ...OFFICIAL_ROLES];

const ORGANIZATION_TYPES = [
  { value: 'NGO', label: 'NGO' },
  { value: 'TOURISM', label: 'Tourism operator' },
  { value: 'MARINE_INSTITUTION', label: 'Marine institution' },
];

const withScheme = (value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`);

function PendingConfirmation({ account }) {
  const navigate = useNavigate();
  const isDiver = account.role === 'DIVER';
  const isOfficial = OFFICIAL_ROLES.includes(account.role);
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-page-warm)', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
          <span style={{ font: '700 20px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Tideline</span>
        </div>
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center' }}>
            <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-verified-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="badge-check" size="xl" color="var(--status-verified)" />
            </span>
            <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Your account has been created</h1>
            <Badge tone="warning" icon="clock">Pending verification</Badge>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)' }}>
              {isDiver
                ? 'An administrator will check your certificates before you can sign in.'
                : isOfficial
                  ? 'An existing administrator will confirm your appointment before you can sign in.'
                  : "An administrator will check your organisation's website before you can sign in and post opportunities."}
            </p>
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
              Try signing in with {account.email} once you&rsquo;ve been verified. If your application isn&rsquo;t approved, you&rsquo;ll see the reason there.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button onClick={() => navigate('/')}>Back to home</Button>
              <Button variant="secondary" onClick={() => navigate('/app')}>Browse reports</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = React.useState('DIVER');
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    province: '',
    password: '',
    certificationLevel: '',
    organizationName: '',
    organizationType: '',
    websiteUrl: '',
  });
  const [certificates, setCertificates] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [pending, setPending] = React.useState(null);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError(null);

    // The design-system Input/Select do not forward `required` to the control, so the red
    // asterisk alone does not stop a submit. These checks are what actually enforce it.
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Enter both your first name and your last name.');
      return;
    }
    if (!form.addressLine.trim() || !form.city.trim() || !form.province) {
      setError('Enter your full address: street, city or town, and province. Cleanup alerts near you depend on it.');
      return;
    }

    if (role === 'DIVER' && !certificates.length) {
      setError('Attach at least one diving certificate so an administrator can verify you.');
      return;
    }
    if (OFFICIAL_ROLES.includes(role) && !form.organizationName.trim()) {
      setError('Add the department or agency you work for.');
      return;
    }
    if (OFFICIAL_ROLES.includes(role) && !certificates.length) {
      setError('Attach proof of your appointment, such as a staff ID or appointment letter.');
      return;
    }
    if (role === 'ORGANIZATION' && !form.websiteUrl.trim()) {
      setError("Add your organisation's website so an administrator can check it.");
      return;
    }

    setBusy(true);
    try {
      // The API stores one name; the form collects it in two parts because that is how people read it.
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      // Street and town are kept together in the city field, which is what the API takes.
      const city = [form.addressLine.trim(), form.city.trim()].filter(Boolean).join(', ');
      const result = await register(
        {
          fullName,
          email: form.email,
          password: form.password,
          phone: form.phone || null,
          role,
          province: form.province,
          city,
          certificationLevel: role === 'DIVER' ? form.certificationLevel || null : null,
          organizationName: role === 'ORGANIZATION' || OFFICIAL_ROLES.includes(role) ? form.organizationName.trim() || null : null,
          organizationType: role === 'ORGANIZATION' ? form.organizationType || null : null,
          websiteUrl: role === 'ORGANIZATION' ? withScheme(form.websiteUrl.trim()) : null,
        },
        NEEDS_DOCUMENTS.includes(role) ? certificates : [],
      );
      if (result.token) {
        navigate('/app', { replace: true });
      } else {
        setPending(result.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (pending) return <PendingConfirmation account={pending} />;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join citizens, divers and organisations protecting the coast."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Field label="I am registering as">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ROLES.map((r) => (
              <ChipButton key={r.value} icon={r.icon} selected={role === r.value} onClick={() => setRole(r.value)}>
                {r.label}
              </ChipButton>
            ))}
          </div>
        </Field>

        <div className="tl-auth-row">
          <Input label="First name" placeholder="e.g. Hiruna" required value={form.firstName} onChange={set('firstName')} />
          <Input label="Last name" placeholder="e.g. Perera" required value={form.lastName} onChange={set('lastName')} />
        </div>

        <Input label="Email" type="email" placeholder="you@example.lk" required value={form.email} onChange={set('email')} />
        <Input label="Phone" type="tel" placeholder="+94 7X XXX XXXX" value={form.phone} onChange={set('phone')} />

        {/* Address is required: nearby-cleanup alerts and the region analytics both depend on it. */}
        <Input
          label="Address"
          placeholder="e.g. 42 Lewis Place"
          required
          value={form.addressLine}
          onChange={set('addressLine')}
          hint="Street and number. Used to alert you about cleanups near you."
        />
        <div className="tl-auth-row">
          <Input label="City or town" placeholder="e.g. Negombo" required value={form.city} onChange={set('city')} />
          <Select label="Province" placeholder="Select your province" required options={PROVINCES} value={form.province} onChange={set('province')} />
        </div>

        {role === 'DIVER' ? (
          <>
            <Select
              label="Certification level"
              placeholder="Select certification"
              options={CERTIFICATION_OPTIONS}
              value={form.certificationLevel}
              onChange={set('certificationLevel')}
            />
            <DocumentPicker
              label="Certificates"
              required
              hint="Your diving certification card or logbook page."
              files={certificates}
              onChange={setCertificates}
            />
          </>
        ) : null}

        {OFFICIAL_ROLES.includes(role) ? (
          <>
            <Input
              label="Department or agency"
              required
              placeholder={role === 'AUTHORITY' ? 'e.g. Marine Environment Protection Authority' : 'e.g. Tideline operations team'}
              value={form.organizationName}
              onChange={set('organizationName')}
            />
            <DocumentPicker
              label="Proof of appointment"
              actionLabel="Add proof of appointment"
              required
              hint="Staff ID card or appointment letter."
              files={certificates}
              onChange={setCertificates}
            />
          </>
        ) : null}

        {role === 'ORGANIZATION' ? (
          <>
            <Input label="Organisation name" required placeholder="e.g. Blue Resurgence NGO" value={form.organizationName} onChange={set('organizationName')} />
            <Select label="Organisation type" placeholder="Select type" options={ORGANIZATION_TYPES} value={form.organizationType} onChange={set('organizationType')} />
            <Input
              label="Website"
              type="url"
              required
              iconLeft="arrow-up-right"
              placeholder="https://your-organisation.org"
              hint="Your official website or public page, so an administrator can confirm who you are."
              value={form.websiteUrl}
              onChange={set('websiteUrl')}
              onBlur={() => form.websiteUrl.trim() && setForm((f) => ({ ...f, websiteUrl: withScheme(f.websiteUrl.trim()) }))}
            />
          </>
        ) : null}

        <PasswordInput
          placeholder="At least 8 characters"
          required
          minLength={8}
          value={form.password}
          onChange={set('password')}
        />

        {error ? <Alert tone="danger" title="Could not create your account">{error}</Alert> : null}

        <Button type="submit" fullWidth size="lg" loading={busy} disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
