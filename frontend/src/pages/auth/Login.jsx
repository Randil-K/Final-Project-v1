import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Input } from '../../design-system';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-page-warm)', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
          <span style={{ font: '700 20px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Tideline</span>
        </div>
        <Card padding="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/app');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Sign in</h1>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>Report and track coastal cleanup activity near you.</p>
            </div>
            <Input label="Email" type="email" placeholder="you@example.lk" iconLeft="user" required />
            <Input label="Password" type="password" placeholder="••••••••" required />
            <Button type="submit" fullWidth size="lg">
              Sign in
            </Button>
            <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>
              New to Tideline? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
