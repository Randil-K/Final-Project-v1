import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card, Button, Badge } from '../design-system';
import { api } from '../api/index.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../auth/AuthContext.jsx';
import ReportCard from '../components/ReportCard.jsx';

const PATHS = [
  {
    icon: 'anchor',
    title: 'Community & volunteer divers',
    body: 'Report polluted sites, verify community reports, and find cleanup and dive opportunities near you.',
    to: '/app',
    cta: 'Open the volunteer app',
  },
  {
    icon: 'shield-check',
    title: 'Government & administration',
    body: 'Review flagged reports, approve or reject cleanup projects, and track pollution trends across regions.',
    to: '/console',
    cta: 'Open the authority console',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useApi(() => api.analytics.summary(), []);
  const recent = useApi(() => api.reports.list({ size: 3 }), []);
  const recentReports = recent.data?.content || [];

  const stats = state.data
    ? [
        { label: 'Reported sites', value: state.data.reportedSites },
        { label: 'Verified incidents', value: state.data.verifiedIncidents },
        { label: 'Active projects', value: state.data.activeProjects },
        { label: 'Volunteers', value: state.data.registeredVolunteers },
      ]
    : [];

  return (
    <div style={{ minHeight: '100%', background: 'var(--surface-page)' }}>
      <header style={{ padding: 'var(--space-6) var(--space-6) 0', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
          <span style={{ font: '700 20px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Tideline</span>
        </div>
        {user ? (
          <Button variant="secondary" iconRight="arrow-right" onClick={() => navigate(user.role === 'ADMIN' || user.role === 'AUTHORITY' ? '/console' : '/app')}>
            Continue as {user.fullName.split(' ')[0]}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => navigate('/login')}>Sign in</Button>
        )}
      </header>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-16) var(--space-6) var(--space-8)' }}>
        <Badge tone="accent" icon="waves-horizontal">Community-based ocean &amp; coastal cleanup</Badge>
        <h1 style={{ font: 'var(--text-display)', letterSpacing: 'var(--tracking-display)', color: 'var(--text-strong)', marginTop: 'var(--space-4)', maxWidth: 720 }}>
          Report a polluted site. Let the community verify it. Get it cleaned.
        </h1>
        <p style={{ font: 'var(--text-body-lg)', color: 'var(--text-body-color)', marginTop: 'var(--space-4)', maxWidth: 620 }}>
          Tideline connects citizens, volunteer divers, government authorities and organisations around one loop for Sri Lanka's coastline.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
          <Button
            size="lg"
            iconLeft="camera"
            onClick={() => (user ? navigate('/app/submit') : navigate('/login', { state: { from: '/app/submit' } }))}
          >
            Report a polluted site
          </Button>
          <Button size="lg" variant="ghost" iconRight="arrow-right" onClick={() => navigate('/app')}>
            Browse reports
          </Button>
        </div>

        {stats.length ? (
          <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ font: '600 28px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{s.value}</div>
                <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {state.error ? (
          <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-6)' }}>
            Live figures are unavailable — the API is not reachable right now.
          </p>
        ) : null}
      </section>

      {recentReports.length ? (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--space-6) var(--space-12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ font: 'var(--text-h2)', letterSpacing: 'var(--tracking-heading)', color: 'var(--text-strong)' }}>Latest reports</h2>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                Open one to see how the community is verifying it.
              </p>
            </div>
            <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => navigate('/app')} style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}>
              See all
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {recentReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--space-6) var(--space-16)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {PATHS.map((p) => (
            <Card key={p.title} tone="default" padding="lg" interactive onClick={() => navigate(p.to)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <span style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={p.icon} size="lg" color="var(--accent-on-soft)" />
                </span>
                <div>
                  <h2 style={{ font: 'var(--text-h3)', color: 'var(--text-strong)' }}>{p.title}</h2>
                  <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)', marginTop: 6 }}>{p.body}</p>
                </div>
                <Button variant="secondary" iconRight="arrow-right" onClick={() => navigate(p.to)}>
                  {p.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
