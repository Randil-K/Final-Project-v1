import React from 'react';
import { Icon } from '../design-system';
import './auth-layout.css';

/**
 * Shared frame for the sign-in and registration pages: the form on one side, a photograph of the
 * coast on the other, the pair held inside one bordered panel that is centred with space left
 * around it.
 *
 * The photograph is Unawatuna beach — the stretch of coast the demo data already uses. It is
 * licensed CC BY-SA 4.0, so the credit in the corner has to stay. See docs/CREDITS.md.
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
              src="/assets/sea-unawatuna.jpg"
              alt="Waves breaking on the shore at Unawatuna beach, Sri Lanka"
              loading="eager"
              decoding="async"
            />

            {/* Required by the photograph's CC BY-SA 4.0 licence — see docs/CREDITS.md. */}
            <p className="tl-auth-credit">
              Unawatuna, Sri Lanka · Photo{' '}
              <a
                href="https://commons.wikimedia.org/wiki/File:The_Turquoise_Beach_-_Unawatuna.jpg"
                target="_blank"
                rel="noreferrer noopener"
              >
                Leesha.S
              </a>{' '}
              ·{' '}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer noopener">
                CC BY-SA 4.0
              </a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
