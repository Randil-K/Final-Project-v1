import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, IconButton, Badge } from '../../design-system';
import PhotoPlaceholder from '../../components/PhotoPlaceholder.jsx';
import ProjectProgress from '../../components/ProjectProgress.jsx';
import ProjectTimeline from '../../components/ProjectTimeline.jsx';
import ProgressUpdateForm from '../../components/ProgressUpdateForm.jsx';
import { Async } from '../../components/AsyncState.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE, locationLine } from '../../lib/format.js';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useApi(() => api.projects.get(id), [id]);

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
              <Badge tone={PROJECT_STATUS_TONE[project.status]} style={{ marginLeft: 'auto' }}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
            </div>

            <div>
              <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>{project.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                <Icon name="map-pin" size="sm" />
                {locationLine(project)}
                {project.owner ? ` · project owner ${project.owner.fullName}` : ''}
              </div>
              {project.description ? (
                <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)', marginTop: 8 }}>{project.description}</p>
              ) : null}
            </div>

            <ProjectProgress project={project} />

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
              <ProjectTimeline updates={project.updates} />
            </div>

            {canPost ? <ProgressUpdateForm projectId={project.id} onUpdated={state.setData} /> : null}
          </div>
        );
      }}
    </Async>
  );
}
