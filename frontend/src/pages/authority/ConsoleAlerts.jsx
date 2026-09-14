import React from 'react';
import AlertList from '../../components/AlertList.jsx';

const linkFor = (alert) => {
  if (alert.type === 'ACCOUNT_REVIEW') return '/console/verifications';
  if (alert.projectId) return `/console/projects/${alert.projectId}`;
  return alert.reportId ? `/console/reports/${alert.reportId}` : null;
};

export default function ConsoleAlerts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 760 }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Alerts</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Reports waiting for a decision, review outcomes, and new accounts to verify.
        </p>
      </div>
      <AlertList linkFor={linkFor} empty="Nothing needs your attention right now." />
    </div>
  );
}
