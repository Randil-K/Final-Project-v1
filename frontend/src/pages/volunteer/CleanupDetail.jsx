import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon, IconButton, Badge, Button, Alert } from '../../design-system';
import { Async } from '../../components/AsyncState.jsx';
import ProjectProgress from '../../components/ProjectProgress.jsx';
import ProjectTimeline from '../../components/ProjectTimeline.jsx';
import ProgressUpdateForm from '../../components/ProgressUpdateForm.jsx';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE, locationLine } from '../../lib/format.js';

export default function CleanupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = useApi(() => api.projects.get(id), [id, user?.id]);
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function join() {
    setJoining(true);
    setError(null);
    try {
      state.setData(await api.projects.join(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  function participation(project) {
    const isOwner = user?.id === project.owner?.id;

    if (project.status === 'COMPLETED') {
      return (
        <Alert tone="success" title="This cleanup is finished">
          {project.debrisRemovedKg != null ? `${project.debrisRemovedKg} kg of debris was removed. ` : ''}
          Thank you to everyone who took part.
        </Alert>
      );
    }
    if (!user) {
      return (
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)' }}>
          <Link to="/login" state={{ from: `/app/cleanups/${id}` }}>Sign in</Link> to join this cleanup.
        </p>
      );
    }
    if (isOwner) {
      return (
        <Alert tone="info" title="You're leading this cleanup">
          Post progress below — the person who reported the site is told when it reaches 100%.
        </Alert>
      );
    }
    if (project.joined) {
      return (
        <Alert tone="success" title="You've joined this cleanup">
          You'll get an alert when it's finished.
        </Alert>
      );
    }
    return (
      <Button size="lg" fullWidth iconLeft="hand-heart" loading={joining} disabled={joining} onClick={join}>
        {joining ? 'Joining…' : 'Join this cleanup'}
      </Button>
    );
  }

  return (
    <Async state={state}>
      {(project) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton icon="chevron-left" label="Back" onClick={() => navigate(-1)} />
            <span style={{ font: '600 13px/1.5 var(--font-mono)', color: 'var(--text-muted)' }}>{project.reference}</span>
            <Badge tone={PROJECT_STATUS_TONE[project.status]} style={{ marginLeft: 'auto' }}>
              {PROJECT_STATUS_LABEL[project.status]}
            </Badge>
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

          <ProjectProgress project={project} />

          {participation(project)}
          {error ? <Alert tone="danger" title="That didn't work">{error}</Alert> : null}

          {project.reportId ? (
            <Button variant="secondary" iconLeft="flag" onClick={() => navigate(`/app/report/${project.reportId}`)} style={{ alignSelf: 'flex-start' }}>
              View the original report
            </Button>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Progress</span>
            <ProjectTimeline updates={project.updates} />
          </div>

          {user?.id === project.owner?.id && project.status !== 'COMPLETED' ? (
            <ProgressUpdateForm projectId={project.id} onUpdated={state.setData} />
          ) : null}
        </div>
      )}
    </Async>
  );
}
