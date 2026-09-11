import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Icon, IconButton, Badge, ProgressBar } from '../../design-system';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import { projects } from '../../data/mock.js';

const STAGE_LABEL = { before: 'Before', during: 'During', after: 'After' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Project not found.</p>
        <Link to="/console/projects">Back to projects</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="chevron-left" label="Back to projects" onClick={() => navigate('/console/projects')} />
        <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{project.ref}</span>
        <Badge tone={project.status === 'completed' ? 'success' : 'accent'} style={{ marginLeft: 'auto' }}>
          {project.status === 'completed' ? 'Completed' : 'Active'}
        </Badge>
      </div>

      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{project.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
          <Icon name="map-pin" size="sm" />
          {project.location.name} · {project.location.province}
        </div>
      </div>

      <div style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
        <ProgressBar label="Completion" value={project.completion} valueLabel={`${project.completion}%`} tone={project.status === 'completed' ? 'verified' : 'accent'} size="lg" />
        <div style={{ display: 'flex', gap: 24, marginTop: 'var(--space-4)' }}>
          <div>
            <div style={{ font: '600 20px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{project.volunteers}</div>
            <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Volunteers</div>
          </div>
          <div>
            <div style={{ font: '600 20px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{project.divers}</div>
            <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Divers</div>
          </div>
          <div>
            <div style={{ font: '600 20px/1 var(--font-mono)', color: 'var(--text-strong)' }}>{new Date(project.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            <div style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>Started</div>
          </div>
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
            <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{project.status === 'completed' ? 'After' : 'Latest update'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Progress timeline</span>
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
                  <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>{new Date(u.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
                <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)', marginTop: 4 }}>{u.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
