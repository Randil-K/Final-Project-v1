import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Input, Alert } from '../../design-system';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      const home = user.role === 'ADMIN' || user.role === 'AUTHORITY'
        ? '/console'
        : user.role === 'ORGANIZATION' ? '/app/opportunities' : '/app';
      const target = location.state?.from || home;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-page-warm)', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
          <span style={{ font: '700 20px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Tideline</span>
        </div>

        <Card padding="lg">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Sign in</h1>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                Report and track coastal cleanup activity near you.
              </p>
            </div>

            {error ? (
              error.code === 'ACCOUNT_PENDING' ? (
                <Alert tone="warning" title="Your account is waiting for verification">{error.message}</Alert>
              ) : error.code === 'ACCOUNT_REJECTED' ? (
                <Alert tone="danger" title="Your account wasn't approved">{error.message}</Alert>
              ) : (
                <Alert tone="danger" title="Could not sign in">{error.message}</Alert>
              )
            ) : null}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.lk"
              iconLeft="user"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" fullWidth size="lg" loading={busy} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>

            <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>
              New to Tideline? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </Card>

        <Card tone="warm" padding="md" style={{ marginTop: 'var(--space-4)' }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Demo accounts</span>
          <p style={{ font: 'var(--text-caption)', color: 'var(--text-body-color)', marginTop: 6 }}>
            All seeded accounts use the password <code>password123</code>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {[
              ['sanduni@example.lk', 'volunteer diver'],
              ['kasun@example.lk', 'project owner'],
              ['admin@tideline.lk', 'administrator'],
              ['officer@mepa.gov.lk', 'authority officer'],
            ].map(([demoEmail, role]) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword('password123');
                }}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 8, cursor: 'pointer', font: 'var(--text-caption)', color: 'var(--text-link)' }}
              >
                <span>{demoEmail}</span>
                <span style={{ color: 'var(--text-muted)' }}>{role}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
