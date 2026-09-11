import React from 'react';
import { Tag } from '../../design-system';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Async } from '../../components/AsyncState.jsx';
import ProjectCard from '../../components/ProjectCard.jsx';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function Cleanups() {
  const { user } = useAuth();
  const [status, setStatus] = React.useState('all');
  const state = useApi(() => api.projects.list({ status }), [status, user?.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Cleanups</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Join a cleanup near you, or follow the ones you've joined.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTERS.map((f) => (
          <Tag key={f.value} selected={status === f.value} onClick={() => setStatus(f.value)}>
            {f.label}
          </Tag>
        ))}
      </div>

      <Async
        state={state}
        isEmpty={(list) => !list?.length}
        empty="No cleanups here yet — you can start one from any verified report."
        emptyIcon="users"
      >
        {(projects) => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} to={`/app/cleanups/${project.id}`} />
            ))}
          </div>
        )}
      </Async>
    </div>
  );
}
