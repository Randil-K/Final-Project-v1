import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon, Avatar } from '../design-system';
import { currentUser } from '../data/mock.js';

const TABS = [
  { to: '/app', label: 'Feed', icon: 'waves-horizontal', end: true },
  { to: '/app/alerts', label: 'Alerts', icon: 'bell' },
  { to: '/app/opportunities', label: 'Opportunities', icon: 'hand-heart' },
  { to: '/app/profile', label: 'Profile', icon: 'user' },
];

export default function VolunteerShell() {
  const navigate = useNavigate();
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
          padding: '0 var(--space-5)',
          background: 'var(--surface-brand)',
          color: 'var(--text-inverse)',
        }}
      >
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Icon name="waves-horizontal" size="md" color="var(--tide-300)" />
          <span style={{ font: '700 18px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--white)' }}>Tideline</span>
        </button>
        <button onClick={() => navigate('/app/profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-inverse-muted)' }}>{currentUser.location}</span>
          <Avatar name={currentUser.name} role={currentUser.role === 'diver' ? 'diver' : undefined} size="sm" />
        </button>
      </header>

      <main style={{ flex: 1, maxWidth: 640, width: '100%', margin: '0 auto', padding: 'var(--space-5) var(--space-4) var(--space-16)' }}>
        <Outlet />
      </main>

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
            <Icon name={t.icon} size="md" />
            <span style={{ font: '600 11px/1 var(--font-body)', letterSpacing: 'var(--tracking-micro)' }}>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
