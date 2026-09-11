import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Icon, IconButton, StatusBadge, Badge, Button, ProgressBar, Avatar, Textarea } from '../../design-system';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import { reports, trustPct } from '../../data/mock.js';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = reports.find((r) => r.id === id);
  const [votes, setVotes] = React.useState(() => (report ? { yes: report.votesTrue, no: report.votesFalse } : { yes: 0, no: 0 }));
  const [myVote, setMyVote] = React.useState(null);
  const [comment, setComment] = React.useState('');

  if (!report) {
    return (
      <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)' }}>Report not found.</p>
        <Link to="/app">Back to feed</Link>
      </div>
    );
  }

  const total = votes.yes + votes.no;
  const pct = total ? Math.round((votes.yes / total) * 100) : 0;

  function vote(kind) {
    if (myVote === kind) return;
    setVotes((v) => {
      const next = { ...v };
      if (myVote) next[myVote] -= 1;
      next[kind] += 1;
      return next;
    });
    setMyVote(kind);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="chevron-left" label="Back" onClick={() => navigate(-1)} />
        <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{report.ref}</span>
        <StatusBadge status={report.status} size="sm" style={{ marginLeft: 'auto' }} />
      </div>

      <PhotoPlaceholder ratio="4/3" count={report.photos} style={{ borderRadius: 'var(--radius-lg)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{report.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
          <Icon name="map-pin" size="sm" />
          {report.location.name} · {report.location.province}
        </div>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)', marginTop: 6 }}>{report.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Avatar name={report.submittedBy} size="sm" />
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
            Reported by {report.submittedBy} · {new Date(report.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Community verification</span>
        <ProgressBar value={pct} tone={pct >= 75 ? 'verified' : 'warning'} />
        <Badge tone={pct >= 75 ? 'success' : 'warning'} style={{ whiteSpace: 'normal', height: 'auto', padding: '6px 10px', alignSelf: 'flex-start' }}>
          {pct}% of {total} voters confirmed — threshold 75%
        </Badge>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 4 }}>
          <Button variant={myVote === 'yes' ? 'primary' : 'secondary'} iconLeft="thumbs-up" fullWidth onClick={() => vote('yes')}>
            Confirm ({votes.yes})
          </Button>
          <Button variant={myVote === 'no' ? 'danger' : 'secondary'} iconLeft="thumbs-down" fullWidth onClick={() => vote('no')}>
            Dispute ({votes.no})
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Discussion</span>
        {report.comments.length ? (
          report.comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <Avatar name={c.author} size="sm" />
              <div>
                <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{c.author}</span>
                <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>{c.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>No comments yet — be the first to add context.</p>
        )}
        <Textarea placeholder="Add what you know about this site…" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        <Button variant="secondary" style={{ alignSelf: 'flex-end' }} disabled={!comment.trim()} onClick={() => setComment('')}>
          Post comment
        </Button>
      </div>
    </div>
  );
}
