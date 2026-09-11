import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, IconButton, Badge, ProgressBar, Button, Select, Textarea, Input, Alert, Card } from '../../design-system';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { formatDate, locationLine } from '../../lib/format.js';

const STAGE_LABEL = { BEFORE: 'Before', DURING: 'During', AFTER: 'After' };
const STATUS_TONE = { PLANNED: 'neutral', ACTIVE: 'accent', COMPLETED: 'success' };
const STATUS_LABEL = { PLANNED: 'Planned', ACTIVE: 'Active', COMPLETED: 'Completed' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = useApi(() => api.projects.get(id), [id]);
  const [update, setUpdate] = React.useState({ stage: 'DURING', note: '', completionPercentage: '', debrisRemovedKg: '' });
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const set = (key) => (event) => setUpdate((u) => ({ ...u, [key]: event.target.value }));

  async function postUpdate(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.projects.addUpdate(id, {
        stage: update.stage,
        note: update.note,
        completionPercentage: update.completionPercentage === '' ? null : Number(update.completionPercentage),
        debrisRemovedKg: update.debrisRemovedKg === '' ? null : Number(update.debrisRemovedKg),
      });
      state.setData(updated);
      setUpdate({ stage: 'DURING', note: '', completionPercentage: '', debrisRemovedKg: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Async state={state}>
      {(project) => {
        const canPost = project.status !== 'COMPLETED'
          && (user?.role === 'ADMIN' || user?.role === 'AUTHORITY' || user?.id === project.owner?.id);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 820 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton icon="chevron-left" label="Back to projects" onClick={() => navigate('/console/projects')} />
              <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{project.reference}</span>
              <Badge tone={STATUS_TONE[project.status]} style={{ marginLeft: 'auto' }}>{STATUS_LABEL[project.status]}</Badge>
            </div>

            <div>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{project.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                <Icon name="map-pin" size="sm" />
                {locationLine(project)}
                {project.owner ? ` · led by ${project.owner.fullName}` : ''}
              </div>
              {project.description ? (
                <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)', marginTop: 8 }}>{project.description}</p>
              ) : null}
            </div>

            <div style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
              <ProgressBar
                label="Completion"
                value={project.completionPercentage}
                valueLabel={`${project.completionPercentage}%`}
                tone={project.status === 'COMPLETED' ? 'verified' : 'accent'}
                size="lg"
              />
              <div style={{ display: 'flex', gap: 24, marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                {[
                  { value: project.volunteerCount, label: 'Volunteers' },
                  { value: project.diverCount, label: 'Divers' },
                  { value: project.debrisRemovedKg != null ? `${project.debrisRemovedKg} kg` : '—', label: 'Debris removed' },
                  { value: project.startedAt ? formatDate(project.startedAt, false) : '—', label: 'Started' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ font: '600 20px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{stat.value}</div>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Before / after</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 8 }}>
                <div>
                  <PhotoPlaceholder ratio="4/3" style={{ borderRadius: 'var(--radius-md)' }} />
                  <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Before</span>
                </div>
                <div>
                  <PhotoPlaceholder ratio="4/3" style={{ borderRadius: 'var(--radius-md)' }} />
                  <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                    {project.status === 'COMPLETED' ? 'After' : 'Latest update'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Progress timeline</span>
              {project.updates?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {project.updates.map((u, i) => (
                    <div key={u.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', marginTop: 4 }} />
                        {i < project.updates.length - 1 ? <span style={{ width: 2, flex: 1, background: 'var(--border-subtle)' }} /> : null}
                      </div>
                      <div style={{ paddingBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Badge tone="neutral" size="sm">{STAGE_LABEL[u.stage]}</Badge>
                          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{formatDate(u.createdAt, false)}</span>
                          {u.completionPercentage != null ? (
                            <span style={{ font: '600 12px/1 var(--font-mono)', color: 'var(--text-muted)' }}>{u.completionPercentage}%</span>
                          ) : null}
                        </div>
                        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)', marginTop: 4 }}>{u.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>No progress recorded yet.</p>
              )}
            </div>

            {canPost ? (
              <Card padding="lg">
                <form onSubmit={postUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Record progress</span>
                  {error ? <Alert tone="danger" title="That didn't post">{error}</Alert> : null}
                  <Select
                    label="Stage"
                    options={[
                      { value: 'BEFORE', label: 'Before' },
                      { value: 'DURING', label: 'During' },
                      { value: 'AFTER', label: 'After' },
                    ]}
                    value={update.stage}
                    onChange={set('stage')}
                  />
                  <Textarea label="Note" required rows={2} placeholder="What happened on site?" value={update.note} onChange={set('note')} />
                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <Input label="Completion %" type="number" min="0" max="100" suffix="%" value={update.completionPercentage} onChange={set('completionPercentage')} style={{ flex: 1, minWidth: 140 }} />
                    <Input label="Debris removed" type="number" min="0" suffix="kg" value={update.debrisRemovedKg} onChange={set('debrisRemovedKg')} style={{ flex: 1, minWidth: 140 }} />
                  </div>
                  <Button type="submit" disabled={busy || !update.note.trim()} style={{ alignSelf: 'flex-start' }}>
                    {busy ? 'Posting…' : 'Post update'}
                  </Button>
                </form>
              </Card>
            ) : null}
          </div>
        );
      }}
    </Async>
  );
}
