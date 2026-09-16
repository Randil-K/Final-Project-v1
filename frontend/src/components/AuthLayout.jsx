import React from 'react';
import { Icon } from '../design-system';
import './auth-layout.css';

/**
 * Shared frame for the sign-in and registration pages: the form on one side, a photograph of the
 * coast on the other, the pair held inside one bordered panel that is centred with space left
 * around it.
 *
 * The photograph is released under CC0, so it carries no credit line — see docs/CREDITS.md for
 * its provenance.
 */
export default function AuthLayout({ title, subtitle, children, footer, width = 'wide' }) {
  return (
    <div className="tl-auth-page">
      <div className={`tl-auth-frame${width === 'narrow' ? ' is-narrow' : ''}`}>
        {/* Form side */}
        <div className="tl-auth-form">
          <div className="tl-auth-brand">
            <Icon name="waves-horizontal" size="lg" color="var(--tide-600)" />
            <span>Tideline</span>
          </div>

          <div className="tl-auth-heading">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          {children}

          {footer ? <div className="tl-auth-footer">{footer}</div> : null}
        </div>

        {/* Picture side — the photograph carries this panel on its own. */}
        <aside className="tl-auth-aside">
          {/* Sticky, so a long form scrolls past a picture that keeps its proportions. */}
          <div className="tl-auth-aside-sticky">
            <img
              className="tl-auth-photo"
              src="/assets/sea-waves.jpg"
              alt="Rippling sea water at dusk"
              loading="eager"
              decoding="async"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
