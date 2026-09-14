import React from 'react';
import AlertList from '../../components/AlertList.jsx';

const linkFor = (alert) => {
  if (alert.type === 'ACCOUNT_REVIEW') return '/app/profile';
  if (alert.projectId) return `/app/cleanups/${alert.projectId}`;
  return alert.reportId ? `/app/report/${alert.reportId}` : null;
};

export default function Alerts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Alerts</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Nearby cleanups, your account and report reviews, and opportunities.
        </p>
      </div>
      <AlertList linkFor={linkFor} empty="No alerts yet — you'll hear from us when a cleanup is planned near you." />
    </div>
  );
}
