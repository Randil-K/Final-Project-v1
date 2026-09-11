import React from 'react';
import AlertList from '../../components/AlertList.jsx';

const linkFor = (alert) =>
  alert.projectId ? `/console/projects/${alert.projectId}` : alert.reportId ? `/console/reports/${alert.reportId}` : null;

export default function ConsoleAlerts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 760 }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Alerts</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Escalations waiting for a decision, authority decisions, and updates on reports you handle.
        </p>
      </div>
      <AlertList linkFor={linkFor} empty="Nothing needs your attention right now." />
    </div>
  );
}
