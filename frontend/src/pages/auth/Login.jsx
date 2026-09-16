import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Checkbox, Input, Alert } from '../../design-system';
import Modal from '../../components/Modal.jsx';
import AuthLayout from '../../components/AuthLayout.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password, remember);
      // Everyone starts on the feed, unless they came from a "Sign in to…" prompt on a report or cleanup.
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  // Pending and rejected applicants can't sign in, so their registration status pops up here instead.
  const reviewError = error && ['ACCOUNT_PENDING', 'ACCOUNT_REJECTED'].includes(error.code) ? error : null;
  const rejected = reviewError?.code === 'ACCOUNT_REJECTED';

  return (
    <>
      <AuthLayout
        width="narrow"
        title="Sign in"
        subtitle="Report and track coastal cleanup activity near you."
        footer={<>New to Tideline? <Link to="/register">Create an account</Link></>}
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {error && !reviewError ? <Alert tone="danger" title="Could not sign in">{error.message}</Alert> : null}

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <Link to="/forgot-password" style={{ font: 'var(--text-body-sm)' }}>Forgot password?</Link>
          </div>

          <Button type="submit" fullWidth size="lg" loading={busy} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <Card tone="warm" padding="md">
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Demo accounts</span>
          <p style={{ font: 'var(--text-caption)', color: 'var(--text-body-color)', marginTop: 6 }}>
            All seeded accounts use the password <code>password123</code>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {[
              ['sanduni@example.lk', 'volunteer diver'],
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
      </AuthLayout>

      <Modal
        open={Boolean(reviewError)}
        title={rejected ? "Your registration wasn't approved" : 'Your account is pending verification'}
        onClose={() => setError(null)}
        footer={
          <Button onClick={() => setError(null)}>{rejected ? 'Close' : 'Got it'}</Button>
        }
      >
        <Alert tone={rejected ? 'danger' : 'warning'} title={rejected ? 'Registration not approved' : 'Pending verification'}>
          {rejected
            ? reviewError?.message
            : "An administrator is checking your certificates or website. You'll be able to sign in once it's approved, and we'll let you know here and in your alerts."}
        </Alert>
      </Modal>
    </>
  );
}
