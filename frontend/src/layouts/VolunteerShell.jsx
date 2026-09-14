import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon, Avatar, Button } from '../design-system';
import { useAuth } from '../auth/AuthContext.jsx';
import { useUnreadAlerts } from '../hooks/useUnreadAlerts.js';
import AccountReviewPopup from '../components/AccountReviewPopup.jsx';

const TABS = [
  { to: '/app', label: 'Feed', icon: 'waves-horizontal', end: true },
  { to: '/app/cleanups', label: 'Cleanups', icon: 'users' },
  { to: '/app/alerts', label: 'Alerts', icon: 'bell', showUnread: true },
  { to: '/app/opportunities', label: 'Opportunities', icon: 'hand-heart' },
  { to: '/app/profile', label: 'Profile', icon: 'user' },
];

export default function VolunteerShell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const unread = useUnreadAlerts();

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-page)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          height: 'var(--appbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '0 var(--space-5)',
          background: 'var(--surface-brand)',
          color: 'var(--text-inverse)',
        }}
      >
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Icon name="waves-horizontal" size="md" color="var(--tide-300)" />
          <span style={{ font: '700 18px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--white)' }}>Tideline</span>
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {user.role === 'ADMIN' || user.role === 'AUTHORITY' ? (
            <Button variant="inverse" size="sm" iconLeft="shield-check" onClick={() => navigate('/console')}>
              Console
            </Button>
          ) : null}
          <button onClick={() => navigate('/app/profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
            <span
              style={{
                font: 'var(--text-body-sm)',
                color: 'var(--text-inverse-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {[user.city, user.province].filter(Boolean).join(' · ')}
            </span>
            <Avatar name={user.fullName} role={user.role === 'DIVER' ? 'diver' : undefined} size="sm" />
          </button>
          </div>
        ) : (
          <Button variant="inverse" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        )}
      </header>

      <main style={{ flex: 1, maxWidth: 640, width: '100%', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-16)' }}>
        <Outlet />
      </main>
      <AccountReviewPopup />

      <nav
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          height: 'var(--tabbar-height)',
          display: 'flex',
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            aria-label={t.showUnread && unread ? `${t.label}, ${unread} unread` : undefined}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            })}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon name={t.icon} size="md" />
              {t.showUnread && unread ? (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 17,
                    height: 17,
                    padding: '0 4px',
                    boxSizing: 'border-box',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--accent)',
                    color: 'var(--white)',
                    font: '700 10px/17px var(--font-body)',
                    textAlign: 'center',
                    boxShadow: '0 0 0 2px var(--surface-card)',
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </span>
            <span style={{ font: '600 11px/1 var(--font-body)', letterSpacing: 'var(--tracking-micro)' }}>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
