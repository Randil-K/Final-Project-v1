import React from 'react';
import { Card, Badge, Button, Tag, Alert, Input, Textarea, Select, Switch, Avatar } from '../../design-system';
import Modal from '../../components/Modal.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { APPLICATION_STATUS, CERTIFICATION_LABEL, CERTIFICATION_OPTIONS, PROVINCES, plural } from '../../lib/format.js';
import { mediaUrl } from '../../api/client.js';

const EMPTY = { title: '', description: '', region: '', requiredCertification: '', paid: false };

/** Module 8 — organisations post assignments and choose divers from their cleanup record. */
export default function OrganisationOpportunities() {
  const { user } = useAuth();
  const state = useApi(() => api.opportunities.list(), []);

  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const ready = form.title.trim() && form.description.trim() && form.region;
  const mine = (list) => (list || []).filter((o) => o.organizationId === user?.id);

  async function post() {
    setBusy(true);
    setError(null);
    try {
      await api.opportunities.create({
        title: form.title.trim(),
        description: form.description.trim(),
        region: form.region,
        requiredCertification: form.requiredCertification || null,
        paid: form.paid,
      });
      setNotice(`Divers who work in ${form.region} have been alerted.`);
      setForm(EMPTY);
      setFormOpen(false);
      state.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Your opportunities</h1>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
            Post assignments for divers and choose from their cleanup record.
          </p>
        </div>
        <Button iconLeft="plus" onClick={() => { setError(null); setFormOpen(true); }}>
          Post
        </Button>
      </div>

      {notice ? <Alert tone="success" title="Opportunity posted" onDismiss={() => setNotice(null)}>{notice}</Alert> : null}

      <Async
        state={state}
        isEmpty={(list) => !mine(list).length}
        empty="You haven't posted anything yet — divers in the region hear about new opportunities straight away."
        emptyIcon="hand-heart"
      >
        {(list) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {mine(list).map((o) => (
              <PostingCard key={o.id} opportunity={o} />
            ))}
          </div>
        )}
      </Async>

      <Modal
        open={formOpen}
        title="Post an opportunity"
        description="Divers whose preferred region matches are alerted as soon as you post."
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button disabled={!ready || busy} onClick={post}>{busy ? 'Posting…' : 'Post opportunity'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {error ? <Alert tone="danger" title="Could not post">{error}</Alert> : null}
          <Input label="Title" required placeholder="e.g. Reef survey diver — 3 day assignment" value={form.title} onChange={set('title')} />
          <Textarea label="Description" required rows={3} maxLength={600} placeholder="What the work involves, the dates, and what you provide." value={form.description} onChange={set('description')} />
          <Select label="Region" required placeholder="Select a region" options={PROVINCES} value={form.region} onChange={set('region')} />
          <Select label="Certification needed" placeholder="Any certification" options={CERTIFICATION_OPTIONS} value={form.requiredCertification} onChange={set('requiredCertification')} />
          <Switch label="Paid assignment" hint="Turn off for volunteer dives." checked={form.paid} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))} />
        </div>
      </Modal>
    </div>
  );
}

function PostingCard({ opportunity }) {
  const [open, setOpen] = React.useState(false);
  const applicants = useApi(
    () => (open ? api.opportunities.applications(opportunity.id) : Promise.resolve([])),
    [open, opportunity.id],
  );
  const [busyId, setBusyId] = React.useState(null);
  const [error, setError] = React.useState(null);

  async function decide(application, status) {
    setBusyId(application.id);
    setError(null);
    try {
      await api.opportunities.decide(application.id, status);
      applicants.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card padding="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{opportunity.title}</span>
          {opportunity.paid ? <Badge tone="success">Paid</Badge> : <Badge tone="neutral">Volunteer</Badge>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag icon="map-pin">{opportunity.region}</Tag>
          {opportunity.requiredCertification ? (
            <Tag icon="badge-check">{CERTIFICATION_LABEL[opportunity.requiredCertification]}</Tag>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconRight={open ? 'chevron-down' : 'chevron-right'}
          onClick={() => setOpen((o) => !o)}
          style={{ alignSelf: 'flex-start' }}
        >
          {open ? 'Hide applicants' : 'Show applicants'}
        </Button>

        {open ? (
          <>
            {error ? <Alert tone="danger" title="That didn't work">{error}</Alert> : null}
            <Async state={applicants} isEmpty={(list) => !list?.length} empty="No applications yet." emptyIcon="users">
              {(list) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {list.map((a) => (
                    <Applicant key={a.id} application={a} busy={busyId === a.id} onDecide={decide} />
                  ))}
                </div>
              )}
            </Async>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function Applicant({ application, busy, onDecide }) {
  const record = [
    application.certificationLevel ? CERTIFICATION_LABEL[application.certificationLevel] : 'No certification listed',
    application.experienceYears != null ? `${application.experienceYears} years diving` : null,
    `${plural(application.completedProjects, 'cleanup')} completed`,
    application.averageMark != null ? `rated ${application.averageMark} / 5` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
      <Avatar name={application.diver?.fullName || ''} src={mediaUrl(application.diver?.avatarUrl)} size="sm" role="diver" />
      <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{application.diver?.fullName}</span>
        <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{record}</span>
        {application.message ? (
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>“{application.message}”</span>
        ) : null}
      </div>
      {application.status === 'PENDING' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="soft" disabled={busy} onClick={() => onDecide(application, 'ACCEPTED')}>Accept</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => onDecide(application, 'DECLINED')}>Decline</Button>
        </div>
      ) : (
        <Badge tone={APPLICATION_STATUS[application.status].tone}>
          {application.status === 'DECLINED' ? 'Declined' : APPLICATION_STATUS[application.status].label}
        </Badge>
      )}
    </div>
  );
}
