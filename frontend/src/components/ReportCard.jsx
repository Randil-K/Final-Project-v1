import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, StatusBadge, Icon } from '../design-system';
import PhotoPlaceholder from './PhotoPlaceholder.jsx';
import { trustPct } from '../data/mock.js';

const SEVERITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const SEVERITY_VAR = { low: '--severity-low', medium: '--severity-medium', high: '--severity-high', critical: '--severity-critical' };

export default function ReportCard({ report, basePath = '/app/report' }) {
  const navigate = useNavigate();
  const pct = trustPct(report);
  return (
    <Card padding="none" interactive onClick={() => navigate(`${basePath}/${report.id}`)} style={{ cursor: 'pointer', overflow: 'hidden' }}>
      <PhotoPlaceholder count={report.photos} />
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.ref}</span>
          <StatusBadge status={report.status} size="sm" />
        </div>
        <h3 style={{ font: 'var(--text-label)', fontSize: 15, color: 'var(--text-strong)' }}>{report.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
          <Icon name="map-pin" size="xs" />
          {report.location.name} · {report.location.province}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-caption)', color: 'var(--text-body-color)' }}>
            <Icon name="triangle-alert" size="xs" color={`var(${SEVERITY_VAR[report.severity]})`} />
            {SEVERITY_LABEL[report.severity]} severity
          </span>
          <span style={{ font: '600 13px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{pct}% trust</span>
        </div>
      </div>
    </Card>
  );
}
