import React from 'react';
import { Icon, Card, Badge, Button, Tag, Alert } from '../../design-system';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Async } from '../../components/AsyncState.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { APPLICATION_STATUS, CERTIFICATION_LABEL, ORGANIZATION_LABEL } from '../../lib/format.js';
import OrganisationOpportunities from './OrganisationOpportunities.jsx';

export default function Opportunities() {
  const { user } = useAuth();
  return user?.role === 'ORGANIZATION' ? <OrganisationOpportunities /> : <DiverOpportunities />;
}

function DiverOpportunities() {
  const { user } = useAuth();
  const isDiver = user?.role === 'DIVER';

  const state = useApi(() => api.opportunities.list(), []);
  const applicationsState = useApi(
    () => (isDiver ? api.opportunities.myApplications() : Promise.resolve([])),
    [isDiver],
  );

  const [error, setError] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);

  const applications = new Map((applicationsState.data || []).map((a) => [a.opportunityId, a]));

  async function apply(id) {
    setError(null);
    setBusyId(id);
    try {
      await api.opportunities.apply(id, 'Available for this assignment.');
      applicationsState.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Diver opportunities</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Assignments from NGOs, tourism operators and marine institutions.
        </p>
      </div>

      {error ? <Alert tone="danger" title="That didn't work">{error}</Alert> : null}
      {!isDiver ? (
        <Alert tone="info" title="Open to volunteer divers">
          Register as a volunteer diver with your certification to apply for these assignments.
        </Alert>
      ) : null}

      <Async
        state={state}
        isEmpty={(list) => !list?.length}
        empty="No open assignments right now — check back after the next cleanup."
        emptyIcon="hand-heart"
      >
        {(opportunities) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {opportunities.map((o) => {
              const application = applications.get(o.id);
              const status = application ? APPLICATION_STATUS[application.status] : null;
              return (
                <Card key={o.id} padding="md">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{o.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--text-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                          <Icon name="building-2" size="xs" />
                          {o.organizationName}
                        </div>
                      </div>
                      {o.paid ? <Badge tone="success">Paid</Badge> : <Badge tone="neutral">Volunteer</Badge>}
                    </div>

                    <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>{o.description}</p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Tag icon="map-pin">{o.region}</Tag>
                      {o.requiredCertification ? (
                        <Tag icon="badge-check">{CERTIFICATION_LABEL[o.requiredCertification]}</Tag>
                      ) : null}
                      {o.organizationType ? (
                        <Tag icon="building-2">{ORGANIZATION_LABEL[o.organizationType]}</Tag>
                      ) : null}
                    </div>

                    {isDiver ? (
                      status ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Badge tone={status.tone} icon={application.status === 'ACCEPTED' ? 'check' : undefined}>{status.label}</Badge>
                          {application.status === 'ACCEPTED' ? (
                            <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                              {o.organizationName} will contact you with the details.
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <Button disabled={busyId === o.id} onClick={() => apply(o.id)} style={{ alignSelf: 'flex-start' }}>
                          {busyId === o.id ? 'Sending…' : 'Express interest'}
                        </Button>
                      )
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Async>
    </div>
  );
}
