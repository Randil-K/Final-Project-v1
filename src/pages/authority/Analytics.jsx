import React from 'react';
import { Icon, Card, Badge } from '../../design-system';
import { stats, regionTrends, reports } from '../../data/mock.js';

const STAT_CARDS = [
  { key: 'reportedSites', label: 'Reported sites', icon: 'map-pin' },
  { key: 'verifiedIncidents', label: 'Verified incidents', icon: 'badge-check' },
  { key: 'activeProjects', label: 'Active projects', icon: 'waves-horizontal' },
  { key: 'completedProjects', label: 'Completed projects', icon: 'check-check' },
  { key: 'volunteers', label: 'Registered volunteers', icon: 'users' },
];

const STATUS_ORDER = ['pending', 'verifying', 'verified', 'escalated', 'rejected', 'cleaned'];

export default function Analytics() {
  const maxRegion = Math.max(...regionTrends.map((r) => r.value));
  const statusCounts = STATUS_ORDER.map((s) => ({ status: s, count: reports.filter((r) => r.status === s).length }));
  const maxStatus = Math.max(...statusCounts.map((s) => s.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Analytics</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>System-wide performance and regional pollution trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        {STAT_CARDS.map((s) => (
          <Card key={s.key} padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size="sm" color="var(--accent-on-soft)" />
              </span>
              <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
            <div style={{ font: '600 30px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{stats[s.key]}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="lg">
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Region-wise pollution trends</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'var(--space-4)' }}>
            {regionTrends.map((r) => (
              <div key={r.region}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--text-caption)', color: 'var(--text-body-color)', marginBottom: 4 }}>
                  <span>{r.region}</span>
                  <span style={{ font: '600 12px/1.5 var(--font-mono)', color: 'var(--text-strong)' }}>{r.value}</span>
                </div>
                <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--gray-200)', overflow: 'hidden' }}>
                  <div style={{ width: `${(r.value / maxRegion) * 100}%`, height: '100%', background: 'var(--sea-600)', borderRadius: 'var(--radius-pill)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Reports by status</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, marginTop: 'var(--space-6)', paddingBottom: 'var(--space-2)' }}>
            {statusCounts.map((s) => (
              <div key={s.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ font: '600 13px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{s.count}</span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    height: Math.max(6, (s.count / maxStatus) * 100),
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    background: 'var(--accent)',
                  }}
                />
                <Badge tone="neutral" size="sm" style={{ textTransform: 'capitalize' }}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
