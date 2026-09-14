import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '../design-system';
import Modal from './Modal.jsx';
import { api } from '../api/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { ALERTS_CHANGED } from '../hooks/useUnreadAlerts.js';

/**
 * Pops up the administrator's decision on a diver's or organisation's registration the first time
 * they sign in after it. The same message stays in their alerts; closing the pop-up marks it read.
 */
export default function AccountReviewPopup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alert, setAlert] = React.useState(null);
  const userId = user?.id;
  const needsReview = ['DIVER', 'ORGANIZATION'].includes(user?.role);

  React.useEffect(() => {
    if (!userId || !needsReview) return undefined;
    let cancelled = false;
    api.alerts
      .list()
      .then((alerts) => {
        const decision = alerts.find((a) => a.type === 'ACCOUNT_REVIEW' && !a.read);
        if (!cancelled && decision) setAlert(decision);
      })
      .catch(() => {
        /* the pop-up is a courtesy; the alert is still in the alert box */
      });
    return () => {
      cancelled = true;
    };
  }, [userId, needsReview]);

  async function close(target) {
    const current = alert;
    setAlert(null);
    try {
      await api.alerts.markRead(current.id);
      window.dispatchEvent(new Event(ALERTS_CHANGED));
    } catch {
      /* marking read is best-effort */
    }
    if (target) navigate(target);
  }

  const verified = user?.accountStatus === 'APPROVED';

  return (
    <Modal
      open={Boolean(alert)}
      title={alert?.title}
      onClose={() => close()}
      footer={
        <>
          <Button variant="secondary" onClick={() => close('/app/alerts')}>View alerts</Button>
          <Button onClick={() => close(verified && user?.role === 'ORGANIZATION' ? '/app/opportunities' : null)}>
            {verified ? 'Get started' : 'Got it'}
          </Button>
        </>
      }
    >
      <Alert tone={verified ? 'success' : 'danger'} title={verified ? 'Registration approved' : 'Registration not approved'}>
        {alert?.body}
      </Alert>
    </Modal>
  );
}
