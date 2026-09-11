import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Icon, IconButton, StatusBadge, Badge, Button, ProgressBar, Avatar, Textarea, Alert, Card, Input } from '../../design-system';
import Modal from '../../components/Modal.jsx';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE, formatDate, locationLine, statusKey } from '../../lib/format.js';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const reportState = useApi(() => api.reports.get(id), [id]);
  const commentsState = useApi(() => (user ? api.reports.comments(id) : Promise.resolve([])), [id, user?.id]);
  const cleanupState = useApi(() => api.projects.list({ reportId: id }), [id]);

  const [comment, setComment] = React.useState('');
  const [actionError, setActionError] = React.useState(null);
  const [voting, setVoting] = React.useState(false);
  const [posting, setPosting] = React.useState(false);

  const [startOpen, setStartOpen] = React.useState(false);
  const [cleanupTitle, setCleanupTitle] = React.useState('');
  const [cleanupPlan, setCleanupPlan] = React.useState('');
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState(null);

  async function vote(confirmed) {
    setActionError(null);
    setVoting(true);
    try {
      reportState.setData(await api.reports.vote(id, confirmed));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setVoting(false);
    }
  }

  async function postComment() {
    setActionError(null);
    setPosting(true);
    try {
      await api.reports.comment(id, comment);
      setComment('');
      commentsState.reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setPosting(false);
    }
  }

  async function startCleanup(report) {
    setStarting(true);
    setStartError(null);
    try {
      const project = await api.projects.create({
        title: cleanupTitle,
        description: cleanupPlan.trim() || null,
        reportId: report.id,
        locationName: report.locationName,
        province: report.province,
      });
      navigate(`/app/cleanups/${project.id}`);
    } catch (error) {
      setStartError(error.message);
      setStarting(false);
    }
  }

  function cleanupSection(report) {
    if (cleanupState.loading) return null;

    const existing = cleanupState.data?.[0];
    if (existing) {
      return (
        <Card padding="md" interactive onClick={() => navigate(`/app/cleanups/${existing.id}`)} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{existing.title}</span>
              <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                {existing.completionPercentage}% done · led by {existing.owner?.fullName}
              </span>
            </div>
            <Badge tone={PROJECT_STATUS_TONE[existing.status]}>{PROJECT_STATUS_LABEL[existing.status]}</Badge>
          </div>
        </Card>
      );
    }

    if (report.status === 'ESCALATED' && report.authorityApproved !== true) {
      return (
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
          Waiting for the authority's decision before a cleanup can start.
        </p>
      );
    }

    const ready = report.status === 'VERIFIED' || (report.status === 'ESCALATED' && report.authorityApproved === true);
    if (!ready) {
      return (
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
          A cleanup can start once the community has verified this report.
        </p>
      );
    }

    if (!user) {
      return (
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
          <Link to="/login" state={{ from: `/app/report/${id}` }}>Sign in</Link> to organise a cleanup for this site.
        </p>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Button
          iconLeft="hand-heart"
          onClick={() => {
            setCleanupTitle(`Cleanup at ${report.locationName}`);
            setStartOpen(true);
          }}
          style={{ alignSelf: 'flex-start' }}
        >
          Start a cleanup
        </Button>
        <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
          You'll lead it. Volunteers within 5 km are alerted and the reporter is told.
        </span>
      </div>
    );
  }

  return (
    <Async state={reportState}>
      {(report) => {
        const total = report.confirmVotes + report.disputeVotes;
        const passed = report.trustPercentage >= report.thresholdPercent;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton icon="chevron-left" label="Back" onClick={() => navigate(-1)} />
              <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.reference}</span>
              <StatusBadge status={statusKey(report.status)} size="sm" style={{ marginLeft: 'auto' }} />
            </div>

            <PhotoPlaceholder ratio="4/3" count={report.photoUrls?.length} style={{ borderRadius: 'var(--radius-lg)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{report.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
                <Icon name="map-pin" size="sm" />
                {locationLine(report)}
              </div>
              <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)', marginTop: 6 }}>{report.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Avatar name={report.reporter?.fullName || ''} size="sm" />
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  Reported by {report.reporter?.fullName} · {formatDate(report.createdAt)}
                </span>
              </div>
            </div>

            {actionError ? <Alert tone="danger" title="That didn't work">{actionError}</Alert> : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Community verification</span>
              <ProgressBar value={report.trustPercentage} tone={passed ? 'verified' : 'warning'} />
              <Badge tone={passed ? 'success' : 'warning'} style={{ whiteSpace: 'normal', height: 'auto', padding: '6px 10px', alignSelf: 'flex-start' }}>
                {total === 0
                  ? `No votes yet — threshold ${report.thresholdPercent}%`
                  : `${report.trustPercentage}% of ${total} voter${total === 1 ? '' : 's'} confirmed — threshold ${report.thresholdPercent}%`}
              </Badge>

              {user ? (
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 4 }}>
                  <Button variant="secondary" iconLeft="thumbs-up" fullWidth disabled={voting} onClick={() => vote(true)}>
                    Confirm ({report.confirmVotes})
                  </Button>
                  <Button variant="secondary" iconLeft="thumbs-down" fullWidth disabled={voting} onClick={() => vote(false)}>
                    Dispute ({report.disputeVotes})
                  </Button>
                </div>
              ) : (
                <p style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  <Link to="/login" state={{ from: `/app/report/${id}` }}>Sign in</Link> to confirm or dispute this report.
                </p>
              )}
            </div>

            {report.authorityComment ? (
              <Alert tone="info" title="Authority comment">{report.authorityComment}</Alert>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Cleanup</span>
              {cleanupSection(report)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Discussion</span>

              {!user ? (
                <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
                  <Link to="/login" state={{ from: `/app/report/${id}` }}>Sign in</Link> to read and join the discussion.
                </p>
              ) : (
                <Async state={commentsState} isEmpty={(list) => !list?.length} empty="No comments yet — be the first to add context." emptyIcon="message-square">
                  {(comments) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {comments.map((c) => (
                        <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                          <Avatar name={c.author?.fullName || ''} size="sm" role={c.official ? 'authority' : undefined} />
                          <div>
                            <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>
                              {c.author?.fullName}
                              {c.official ? <Badge tone="info" size="sm" style={{ marginLeft: 8 }}>Official</Badge> : null}
                            </span>
                            <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>{c.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Async>
              )}

              {user ? (
                <>
                  <Textarea placeholder="Add what you know about this site…" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
                  <Button variant="secondary" style={{ alignSelf: 'flex-end' }} disabled={!comment.trim() || posting} onClick={postComment}>
                    {posting ? 'Posting…' : 'Post comment'}
                  </Button>
                </>
              ) : null}
            </div>

            <Modal
              open={startOpen}
              title="Start a cleanup"
              description={`You'll lead this cleanup for ${report.reference}. Volunteers within 5 km are alerted, and the person who reported the site is told.`}
              onClose={() => setStartOpen(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setStartOpen(false)}>Cancel</Button>
                  <Button disabled={starting || !cleanupTitle.trim()} onClick={() => startCleanup(report)}>
                    {starting ? 'Starting…' : 'Start cleanup'}
                  </Button>
                </>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {startError ? <Alert tone="danger" title="Could not start the cleanup">{startError}</Alert> : null}
                <Input label="Name" required value={cleanupTitle} onChange={(e) => setCleanupTitle(e.target.value)} />
                <Textarea
                  label="Plan"
                  rows={3}
                  maxLength={400}
                  placeholder="Meeting point, time, what to bring…"
                  value={cleanupPlan}
                  onChange={(e) => setCleanupPlan(e.target.value)}
                />
              </div>
            </Modal>
          </div>
        );
      }}
    </Async>
  );
}
