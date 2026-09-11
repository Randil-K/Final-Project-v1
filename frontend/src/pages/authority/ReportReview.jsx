import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, IconButton, StatusBadge, Badge, Button, ProgressBar, Avatar, Textarea, Alert } from '../../design-system';
import Modal from '../../components/Modal.jsx';
import MapLink from '../../components/MapLink.jsx';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { formatDate, locationLine, statusKey } from '../../lib/format.js';

export default function ReportReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = useApi(() => api.reports.get(id), [id]);
  const [comment, setComment] = React.useState('');
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isAuthority = user?.role === 'AUTHORITY';

  async function run(action, successMessage) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await action();
      if (updated?.id) state.setData(updated);
      else state.reload();
      setNotice(successMessage);
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setRejectOpen(false);
    }
  }

  return (
    <Async state={state}>
      {(report) => {
        const total = report.confirmVotes + report.disputeVotes;
        const passed = report.trustPercentage >= report.thresholdPercent;
        const canEscalate = report.status === 'VERIFIED' || report.status === 'VERIFYING';
        const canDecide = isAuthority && report.status === 'ESCALATED';
        const canModerate = isAdmin && report.status !== 'ESCALATED' && report.status !== 'CLEANED';
        const canWiden = isAdmin && report.status !== 'CLEANED' && report.status !== 'REJECTED';
        const hasComment = Boolean(comment.trim());

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton icon="chevron-left" label="Back to queue" onClick={() => navigate('/console')} />
              <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.reference}</span>
              <StatusBadge status={statusKey(report.status)} style={{ marginLeft: 'auto' }} />
            </div>

            {notice ? <Alert tone="success" title="Done" onDismiss={() => setNotice(null)}>{notice}</Alert> : null}
            {error ? <Alert tone="danger" title="That didn't work">{error}</Alert> : null}

            <PhotoPlaceholder ratio="4/3" count={report.photoUrls?.length} style={{ borderRadius: 'var(--radius-lg)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{report.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <Icon name="map-pin" size="sm" />
                {locationLine(report)} · {report.latitude?.toFixed(4)}° N, {report.longitude?.toFixed(4)}° E
              </div>
              <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)' }}>{report.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Avatar name={report.reporter?.fullName || ''} size="sm" />
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginRight: 'auto' }}>
                  Reported by {report.reporter?.fullName} · {formatDate(report.createdAt)}
                </span>
                <MapLink latitude={report.latitude} longitude={report.longitude} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Community verification</span>
                <Badge tone={passed ? 'success' : 'warning'} style={{ whiteSpace: 'normal', height: 'auto', padding: '6px 10px' }}>
                  {total === 0
                    ? `No votes yet — threshold ${report.thresholdPercent}%`
                    : `${report.trustPercentage}% of ${total} voter${total === 1 ? '' : 's'} confirmed — threshold ${report.thresholdPercent}%`}
                </Badge>
              </div>
              <ProgressBar value={report.trustPercentage} tone={passed ? 'verified' : 'warning'} />
              {!passed ? (
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  Below threshold — requires an administrator decision before it can proceed.
                </span>
              ) : null}
            </div>

            {report.moderationComment ? (
              <Alert tone="info" title="Moderation note">{report.moderationComment}</Alert>
            ) : null}
            {report.authorityComment ? (
              <Alert tone="info" title="Authority decision recorded">{report.authorityComment}</Alert>
            ) : null}
            {isAdmin && report.status === 'ESCALATED' ? (
              <Alert tone="info" title="With the authority">
                Moderation resumes once an authority officer approves or rejects the cleanup request.
              </Alert>
            ) : null}

            {canDecide || canModerate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Official comment</span>
                <Textarea
                  placeholder={canDecide ? 'Conditions or reasons for your decision.' : 'What should the reporter clarify, or why is this decision being made?'}
                  hint={canDecide ? 'Required to approve or reject — the reporter sees it.' : 'Required to ask for clarification or reject — the reporter sees it.'}
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {canDecide ? (
                <>
                  <Button
                    iconLeft="shield-check"
                    disabled={busy || !hasComment}
                    onClick={() => run(() => api.reports.authorityDecision(id, true, comment), 'Cleanup approved. The reporter and administrators have been notified.')}
                  >
                    Approve cleanup
                  </Button>
                  <Button variant="danger" iconLeft="x" disabled={busy} onClick={() => setRejectOpen(true)}>
                    Reject request
                  </Button>
                </>
              ) : null}

              {isAdmin && canEscalate ? (
                <Button
                  iconLeft="flag"
                  disabled={busy}
                  onClick={() => run(() => api.reports.escalate(id), 'Escalated. Authority officers have been alerted.')}
                >
                  Escalate to authority
                </Button>
              ) : null}
              {canModerate && report.status !== 'VERIFIED' ? (
                <Button
                  variant="secondary"
                  iconLeft="badge-check"
                  disabled={busy}
                  onClick={() => run(() => api.reports.moderate(id, 'VERIFIED', comment || null), 'Report marked verified.')}
                >
                  Mark verified
                </Button>
              ) : null}
              {canModerate ? (
                <Button
                  variant="secondary"
                  iconLeft="message-square"
                  disabled={busy || !hasComment}
                  onClick={() => run(() => api.reports.moderate(id, 'VERIFYING', comment), 'Clarification requested. Your question is in the discussion and the reporter has been alerted.')}
                >
                  Request clarification
                </Button>
              ) : null}
              {canModerate && report.status !== 'REJECTED' ? (
                <Button variant="danger" iconLeft="x" disabled={busy} onClick={() => setRejectOpen(true)}>
                  Reject report
                </Button>
              ) : null}
              {canWiden ? (
                <Button
                  variant="ghost"
                  iconLeft="bell"
                  disabled={busy}
                  onClick={() => run(() => api.reports.widenAlert(id), 'Alert radius widened.')}
                >
                  Widen alert radius
                </Button>
              ) : null}
            </div>

            <Modal
              open={rejectOpen}
              title="Reject this report?"
              description="The reporter is notified with your comment. This cannot be undone from the console."
              onClose={() => setRejectOpen(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button
                    variant="danger"
                    disabled={busy || !hasComment}
                    onClick={() =>
                      run(
                        () =>
                          canDecide
                            ? api.reports.authorityDecision(id, false, comment)
                            : api.reports.moderate(id, 'REJECTED', comment),
                        'Report rejected. The reporter has been notified.',
                      )
                    }
                  >
                    Reject report
                  </Button>
                </>
              }
            >
              <Textarea
                label="Reason"
                required
                rows={3}
                placeholder="Explain why this report is being rejected…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                hint="An official comment is required before rejection."
              />
            </Modal>
          </div>
        );
      }}
    </Async>
  );
}
