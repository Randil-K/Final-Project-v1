import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Icon, IconButton, Button, Avatar, Textarea, Alert } from '../../design-system';
import Modal from '../../components/Modal.jsx';
import MapLink from '../../components/MapLink.jsx';
import EvidenceGallery from '../../components/EvidenceGallery.jsx';
import ReportStatusBadge from '../../components/ReportStatusBadge.jsx';
import CommunityVerificationCard from '../../components/CommunityVerificationCard.jsx';
import ReviewStatusCard from '../../components/ReviewStatusCard.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { formatDate, locationLine } from '../../lib/format.js';

const projectHref = (projectId) => `/console/projects/${projectId}`;

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
      const message = typeof successMessage === 'function' ? successMessage(updated) : successMessage;
      if (updated.projectId) {
        // The report is a project now — carry on from the project page.
        navigate(projectHref(updated.projectId), { replace: true, state: { notice: message } });
        return;
      }
      state.setData(updated);
      setNotice(message);
      setComment('');
      setRejectOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const moderate = (decision, message) => run(() => api.reports.moderate(id, decision, comment.trim() || null), message);
  const decide = (decision, message) => run(() => api.reports.authorityDecision(id, decision, comment.trim()), message);

  return (
    <Async state={state}>
      {(report) => {
        const canModerate = isAdmin && ['PENDING', 'VERIFYING', 'VERIFIED'].includes(report.status);
        const canDecide = isAuthority && report.status === 'ESCALATED';
        const canWiden = isAdmin && ['PENDING', 'VERIFYING', 'VERIFIED', 'ESCALATED'].includes(report.status);
        const hasComment = Boolean(comment.trim());
        if (report.projectId) return <Navigate to={projectHref(report.projectId)} replace />;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton icon="chevron-left" label="Back to queue" onClick={() => navigate('/console')} />
              <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.reference}</span>
              <ReportStatusBadge status={report.status} style={{ marginLeft: 'auto' }} />
            </div>

            {notice ? <Alert tone="success" title="Done" onDismiss={() => setNotice(null)}>{notice}</Alert> : null}
            {error && !rejectOpen ? <Alert tone="danger" title="That didn't work">{error}</Alert> : null}


            <EvidenceGallery report={report} />

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
                  {user?.id === report.reporter?.id ? 'Reported by you' : `Reported by ${report.reporter?.fullName}`} · {formatDate(report.createdAt)}
                </span>
                <MapLink latitude={report.latitude} longitude={report.longitude} />
              </div>
            </div>

            <CommunityVerificationCard report={report}>
              {canModerate && report.trustPercentage < report.thresholdPercent ? (
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  Below the community threshold — you can still approve it if the evidence is clear.
                </span>
              ) : null}
            </CommunityVerificationCard>

            <ReviewStatusCard report={report} />

            {isAdmin && report.status === 'ESCALATED' ? (
              <Alert tone="info" title="With the government authority">
                Nothing more for you to do until an authority officer approves, rejects or asks for more detail.
              </Alert>
            ) : null}
            {isAuthority && report.status !== 'ESCALATED' && !report.projectId && report.authorityDecision == null ? (
              <Alert tone="info" title="Not sent to the authority yet">
                An administrator has to approve this report before you can decide on it.
              </Alert>
            ) : null}

            {canModerate || canDecide ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>
                    {canDecide ? 'Your decision as the government authority' : 'Your review as administrator'}
                  </span>
                  <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                    {canDecide
                      ? `Approving creates the cleanup project, with ${report.reporter?.fullName} as project owner.`
                      : 'Approving sends the report to the government authority for a decision.'}
                  </p>
                </div>
                <Textarea
                  label="Official comment"
                  placeholder={canDecide ? 'Conditions, instructions or reasons for your decision.' : 'Notes for the authority, or what the reporter should clarify.'}
                  hint={canDecide
                    ? 'Required for every decision — the reporter and administrators see it.'
                    : 'Required to request more information or reject — the reporter sees it.'}
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {canModerate ? (
                    <>
                      <Button
                        iconLeft="flag"
                        disabled={busy}
                        onClick={() => moderate('APPROVED', 'Approved. The report is with the government authority, and officers have been alerted.')}
                      >
                        Approve and send to authority
                      </Button>
                      <Button
                        variant="secondary"
                        iconLeft="message-square"
                        disabled={busy || !hasComment}
                        onClick={() => moderate('MORE_INFO_REQUESTED', 'More information requested. Your question is in the discussion and the reporter has been alerted.')}
                      >
                        Request more info
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        iconLeft="shield-check"
                        disabled={busy || !hasComment}
                        onClick={() => decide('APPROVED', (updated) => `Approved. Project ${updated.projectReference} has been created and ${updated.reporter?.fullName} is its project owner.`)}
                      >
                        Approve and create project
                      </Button>
                      <Button
                        variant="secondary"
                        iconLeft="message-square"
                        disabled={busy || !hasComment}
                        onClick={() => decide('MORE_INFO_REQUESTED', 'More information requested. The reporter and administrators have been alerted.')}
                      >
                        Request more info
                      </Button>
                    </>
                  )}
                  <Button variant="danger" iconLeft="x" disabled={busy} onClick={() => { setError(null); setRejectOpen(true); }}>
                    Reject report
                  </Button>
                </div>
              </div>
            ) : null}

            {canWiden ? (
              <Button
                variant="ghost"
                iconLeft="bell"
                disabled={busy}
                onClick={() => run(async () => { await api.reports.widenAlert(id); return api.reports.get(id); }, 'Alert radius widened.')}
                style={{ alignSelf: 'flex-start' }}
              >
                Widen alert radius
              </Button>
            ) : null}

            <Modal
              open={rejectOpen}
              title="Reject this report?"
              description="The reporter is notified with your reason, and the report is closed."
              onClose={() => setRejectOpen(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button
                    variant="danger"
                    disabled={busy || !hasComment}
                    onClick={() => (canDecide
                      ? decide('REJECTED', 'Report rejected. The reporter and administrators have been notified.')
                      : moderate('REJECTED', 'Report rejected. The reporter has been notified.'))}
                  >
                    Reject report
                  </Button>
                </>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {error ? <Alert tone="danger" title="Could not reject">{error}</Alert> : null}
                <Textarea
                  label="Reason"
                  required
                  rows={3}
                  placeholder="Explain why this report is being rejected…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </Modal>
          </div>
        );
      }}
    </Async>
  );
}
