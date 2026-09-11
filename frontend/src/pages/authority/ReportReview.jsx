import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Icon, IconButton, StatusBadge, Badge, Button, ProgressBar, Avatar, Textarea, Dialog, Alert } from '../../design-system';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import { reports, trustPct } from '../../data/mock.js';

export default function ReportReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = reports.find((r) => r.id === id);
  const [status, setStatus] = React.useState(report?.status);
  const [comment, setComment] = React.useState('');
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [decided, setDecided] = React.useState(null);

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Report not found.</p>
        <Link to="/console">Back to queue</Link>
      </div>
    );
  }

  const pct = trustPct(report);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="chevron-left" label="Back to queue" onClick={() => navigate('/console')} />
        <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.ref}</span>
        <StatusBadge status={status} style={{ marginLeft: 'auto' }} />
      </div>

      {decided === 'escalated' ? (
        <Alert tone="success" title="Escalated to government authority">
          Official comment required before rejection. The reporter is notified, and MEPA has been sent this report for review.
        </Alert>
      ) : decided === 'rejected' ? (
        <Alert tone="danger" title="Report rejected">
          The reporter has been notified with your comment.
        </Alert>
      ) : null}

      <PhotoPlaceholder ratio="4/3" count={report.photos} style={{ borderRadius: 'var(--radius-lg)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{report.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
          <Icon name="map-pin" size="sm" />
          {report.location.name} · {report.location.province}
        </div>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)' }}>{report.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={report.submittedBy} size="sm" />
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
            Reported by {report.submittedBy} · {new Date(report.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Community verification</span>
          <Badge tone={pct >= 75 ? 'success' : 'warning'} style={{ whiteSpace: 'normal', height: 'auto', padding: '6px 10px' }}>
            {pct}% of {report.votesTrue + report.votesFalse} voters confirmed — threshold 75%
          </Badge>
        </div>
        <ProgressBar value={pct} tone={pct >= 75 ? 'verified' : 'warning'} />
        {pct < 75 ? (
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Below threshold — requires admin decision before it can proceed.</span>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Official comment</span>
        <Textarea placeholder="Record instructions or context for the reporter and any escalated authority." rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Button
          iconLeft="flag"
          onClick={() => {
            setStatus('escalated');
            setDecided('escalated');
          }}
        >
          Escalate to authority
        </Button>
        <Button variant="secondary" iconLeft="badge-check" onClick={() => setStatus('verified')}>
          Mark verified
        </Button>
        <Button variant="danger" iconLeft="x" onClick={() => setRejectOpen(true)}>
          Reject report
        </Button>
      </div>

      <Dialog
        open={rejectOpen}
        title="Reject this report?"
        description="The reporter is notified with your comment. This cannot be undone from the console."
        onClose={() => setRejectOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setStatus('rejected');
                setDecided('rejected');
                setRejectOpen(false);
              }}
            >
              Reject report
            </Button>
          </>
        }
      >
        <Textarea label="Reason" required rows={3} placeholder="Explain why this report is being rejected…" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Dialog>
    </div>
  );
}
