import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Icon } from '../design-system';
import { REVIEW_DECISION, formatDate } from '../lib/format.js';

function DecisionBadge({ decision, fallback }) {
  const d = decision ? REVIEW_DECISION[decision] : null;
  if (!d) return <Badge tone="neutral">{fallback}</Badge>;
  return <Badge tone={d.tone} icon={d.icon}>{d.label}</Badge>;
}

function Step({ title, badge, note, meta, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{title}</span>
        {badge}
      </div>
      {note ? (
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)', paddingLeft: 10, borderLeft: '2px solid var(--border-default)' }}>
          {note}
        </p>
      ) : null}
      {meta ? <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{meta}</span> : null}
      {children}
    </div>
  );
}

/**
 * The review path after community verification: administrator, then government authority, and —
 * once the authority approves — the cleanup project the report became.
 */
export default function ReviewStatusCard({ report, projectHref }) {
  const authorityFallback = report.adminDecision === 'REJECTED' ? 'Not sent' : 'Waiting for administrator';
  const authorityMeta = report.decidedAt
    ? `Updated ${formatDate(report.decidedAt)}${report.authorityOfficer ? ` by ${report.authorityOfficer.fullName}` : ''}`
    : report.escalatedAt
      ? `Sent to the authority ${formatDate(report.escalatedAt)}`
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
      <div>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Official review</span>
        <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
          An administrator reviews the report, then the government authority decides. Approval turns it into a cleanup project.
        </p>
      </div>

      <Step
        title="Administrator"
        badge={<DecisionBadge decision={report.adminDecision} fallback="Pending" />}
        note={report.moderationComment}
        meta={report.adminReviewedAt ? `Updated ${formatDate(report.adminReviewedAt)}` : null}
      />

      <Step
        title="Government authority"
        badge={<DecisionBadge decision={report.authorityDecision} fallback={authorityFallback} />}
        note={report.authorityComment}
        meta={authorityMeta}
      />

      <Step
        title="Cleanup project"
        badge={
          report.projectId
            ? <Badge tone="success" icon="check">Created</Badge>
            : <Badge tone="neutral">After approval</Badge>
        }
      >
        {report.projectId ? (
          <Link
            to={projectHref(report.projectId)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--text-label)', color: 'var(--text-link)' }}
          >
            <Icon name="flag" size="sm" />
            {report.projectReference} · owned by {report.reporter?.fullName}
            <Icon name="arrow-right" size="sm" />
          </Link>
        ) : (
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
            Created automatically when the authority approves, with the reporter as project owner.
          </span>
        )}
      </Step>
    </div>
  );
}
