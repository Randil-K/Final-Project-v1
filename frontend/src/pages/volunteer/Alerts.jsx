import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Card, Badge } from '../../design-system';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Async } from '../../components/AsyncState.jsx';
import { timeAgo } from '../../lib/format.js';

const KIND = {
  NEW_REPORT_NEARBY: { icon: 'map-pin', color: 'var(--tide-600)' },
  REPORT_VERIFIED: { icon: 'badge-check', color: 'var(--status-verified)' },
  ALERT_ESCALATED: { icon: 'flag', color: 'var(--status-escalated)' },
  PROJECT_PLANNED: { icon: 'hand-heart', color: 'var(--tide-600)' },
  PROJECT_UPDATE: { icon: 'check-check', color: 'var(--status-verified)' },
  AUTHORITY_DECISION: { icon: 'shield-check', color: 'var(--sea-600)' },
  OPPORTUNITY: { icon: 'anchor', color: 'var(--buoy-600)' },
};

export default function Alerts() {
  const navigate = useNavigate();
  const state = useApi(() => api.alerts.list(), []);

  async function open(alert) {
    if (!alert.read) {
      try {
        await api.alerts.markRead(alert.id);
        state.reload();
      } catch {
        /* marking read is best-effort */
      }
    }
    if (alert.projectId) navigate(`/app/cleanups/${alert.projectId}`);
    else if (alert.reportId) navigate(`/app/report/${alert.reportId}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Alerts</h1>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
          Nearby cleanups, verification results and opportunities.
        </p>
      </div>

      <Async
        state={state}
        isEmpty={(list) => !list?.length}
        empty="No alerts yet — you'll hear from us when a cleanup is planned near you."
        emptyIcon="bell"
      >
        {(alerts) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {alerts.map((alert) => {
              const kind = KIND[alert.type] || KIND.NEW_REPORT_NEARBY;
              return (
                <Card
                  key={alert.id}
                  padding="md"
                  tone={alert.read ? 'default' : 'accent'}
                  interactive={Boolean(alert.projectId || alert.reportId)}
                  onClick={() => open(alert)}
                  style={{ cursor: alert.projectId || alert.reportId || !alert.read ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                      <Icon name={kind.icon} size="sm" color={kind.color} />
                    </span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>{alert.title}</span>
                        {!alert.read ? <Badge tone="accent" dot size="sm">New</Badge> : null}
                      </div>
                      <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-body-color)' }}>{alert.body}</p>
                      <span style={{ font: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                        {timeAgo(alert.createdAt)}
                        {alert.radiusKm ? ` · within ${alert.radiusKm} km` : ''}
                      </span>
                    </div>
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
