import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Input, Select, Field, Tag } from '../../design-system';

const ROLES = [
  { value: 'citizen', label: 'Community member', icon: 'user' },
  { value: 'diver', label: 'Volunteer diver', icon: 'anchor' },
  { value: 'organization', label: 'Organisation (NGO / tourism / marine)', icon: 'building-2' },
];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = React.useState('diver');

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-page-warm)', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
          <span style={{ font: '700 20px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Tideline</span>
        </div>
        <Card padding="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(role === 'organization' ? '/app/opportunities' : '/app');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Create your account</h1>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>Join citizens, divers and organisations protecting the coast.</p>
            </div>

            <Field label="I am registering as">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ROLES.map((r) => (
                  <Tag key={r.value} icon={r.icon} selected={role === r.value} onClick={() => setRole(r.value)}>
                    {r.label}
                  </Tag>
                ))}
              </div>
            </Field>

            <Input label="Full name" placeholder="e.g. Sanduni Perera" required />
            <Input label="Email" type="email" placeholder="you@example.lk" required />
            <Input label="Phone" type="tel" placeholder="+94 7X XXX XXXX" required />
            <Select
              label="Location"
              placeholder="Select your province"
              options={['Western Province', 'Southern Province', 'Eastern Province', 'North Western Province', 'Northern Province']}
              required
            />

            {role === 'diver' ? (
              <>
                <Select
                  label="Certification level"
                  placeholder="Select certification"
                  options={['Open Water', 'Advanced Open Water', 'Rescue Diver', 'Divemaster', 'Instructor']}
                  hint="You can add experience and equipment details later in your profile."
                />
              </>
            ) : null}

            {role === 'organization' ? (
              <Select label="Organisation type" placeholder="Select type" options={['NGO', 'Tourism operator', 'Marine institution']} />
            ) : null}

            <Input label="Password" type="password" placeholder="At least 8 characters" required />

            <Button type="submit" fullWidth size="lg">
              Create account
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
