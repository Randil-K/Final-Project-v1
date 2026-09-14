import React from 'react';
import { Avatar, Icon } from '../design-system';
import PhotoPlaceholder from './PhotoPlaceholder.jsx';
import { api } from '../api/index.js';
import { useApi } from '../hooks/useApi.js';
import { SEVERITY_LABEL, SEVERITY_VAR, formatDate, plural } from '../lib/format.js';

function Row({ icon, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>
      <Icon name={icon} size="sm" color="var(--text-muted)" style={{ marginTop: 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>{children}</div>
    </div>
  );
}

/**
 * The evidence and approvals a project was created from. Approved reports only exist as projects,
 * so this is where the original photos, community check and official sign-off stay visible.
 */
export default function ProjectOrigin({ project }) {
  const state = useApi(() => (project.reportId ? api.reports.get(project.reportId) : Promise.resolve(null)), [project.reportId]);
  const origin = state.data;
  if (!origin) return null;

  const votes = origin.confirmVotes + origin.disputeVotes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
      <div>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>How this project started</span>
        <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
          Spotted by a member of the community, checked by others, and approved by the government authority.
        </p>
      </div>

      <PhotoPlaceholder ratio="16/9" count={origin.photoUrls?.length} style={{ borderRadius: 'var(--radius-md)' }} />

      <Row icon="user">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={origin.reporter?.fullName || ''} size="xs" />
          Pollution spotted by <strong style={{ color: 'var(--text-heading)' }}>{origin.reporter?.fullName}</strong> on {formatDate(origin.createdAt)}
        </span>
      </Row>

      <Row icon="triangle-alert">
        <span>
          <span style={{ color: `var(${SEVERITY_VAR[origin.severity]})`, font: 'var(--text-label)' }}>{SEVERITY_LABEL[origin.severity]}</span> severity
        </span>
      </Row>

      <Row icon="users">
        <span>
          {votes
            ? `${origin.trustPercentage}% of ${plural(votes, 'community vote')} confirmed the site`
            : 'Sent for official review without community votes'}
        </span>
      </Row>

      <Row icon="shield-check">
        <span>
          Approved by the government authority
          {origin.authorityOfficer ? ` (${origin.authorityOfficer.fullName})` : ''}
          {origin.decidedAt ? ` on ${formatDate(origin.decidedAt)}` : ''}
        </span>
        {origin.authorityComment ? (
          <span style={{ paddingLeft: 10, borderLeft: '2px solid var(--border-default)', color: 'var(--text-body-color)' }}>
            {origin.authorityComment}
          </span>
        ) : null}
      </Row>
    </div>
  );
}
