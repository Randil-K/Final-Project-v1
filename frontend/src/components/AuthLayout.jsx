import React from 'react';
import { Icon } from '../design-system';
import './auth-layout.css';

/**
 * Shared frame for the sign-in and registration pages: the form on one side, a coastal scene on
 * the other, the pair held inside one bordered panel that is centred with space left around it.
 * The artwork is drawn rather than photographed, in the same palette as the landing page.
 */

/** Sri Lanka's coast, seen from the water: sky, sea, sand, and the litter a cleanup goes after. */
function CoastPanelScene() {
  return (
    <svg
      viewBox="0 0 520 720"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a2532" />
          <stop offset="0.55" stopColor="#1a6180" />
          <stop offset="1" stopColor="#7fc6dd" />
        </linearGradient>
        <linearGradient id="auth-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2483a8" />
          <stop offset="1" stopColor="#068b85" />
        </linearGradient>
        <linearGradient id="auth-deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#068b85" />
          <stop offset="1" stopColor="#05171f" />
        </linearGradient>
      </defs>

      <rect width="520" height="720" fill="url(#auth-sky)" />

      {/* Sun low over the water */}
      <circle cx="398" cy="132" r="40" fill="#f5c45b" opacity="0.95" />

      {/* Headland */}
      <path d="M0 296 C 70 268 120 288 168 276 C 210 266 248 282 292 274 L292 340 L0 340 Z" fill="#0f3446" opacity="0.65" />

      {/* Sea */}
      <path d="M0 330 C 110 312 210 346 320 326 C 410 310 470 334 520 322 L520 470 L0 470 Z" fill="url(#auth-sea)" />
      <path d="M0 372 C 120 356 220 386 330 368 C 420 354 480 372 520 362" stroke="#b4e0ec" strokeWidth="3" fill="none" opacity="0.55" />
      <path d="M0 414 C 130 400 230 426 340 410 C 430 398 486 412 520 404" stroke="#dcf0f6" strokeWidth="2" fill="none" opacity="0.35" />

      {/* Sand */}
      <path d="M0 452 C 120 436 250 470 368 450 C 440 438 486 450 520 444 L520 720 L0 720 Z" fill="#f3e2bb" />
      <path d="M0 486 C 130 472 250 500 372 482 C 442 472 488 482 520 478" stroke="#e7decb" strokeWidth="3" fill="none" opacity="0.8" />

      {/* Palm on the left */}
      <path
        d="M104 720 L104 528 M104 528 C 70 508 52 494 30 500 M104 528 C 138 500 174 498 202 506 M104 528 C 86 482 94 456 108 436 M104 528 C 134 508 166 522 180 542"
        stroke="#0f3446"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Litter the cleanup collects */}
      <rect x="196" y="556" width="40" height="15" rx="6" fill="#47a6c7" transform="rotate(-16 216 563)" />
      <rect x="318" y="592" width="31" height="13" rx="6" fill="#e09414" transform="rotate(21 333 598)" />
      <circle cx="404" cy="566" r="9" fill="#ffffff" stroke="#b4e0ec" strokeWidth="3" />
      <path d="M138 612 l22 -7 l9 13 l-19 8 z" fill="#ff9f8a" />
      <rect x="240" y="648" width="46" height="16" rx="7" fill="#dcf0f6" opacity="0.9" transform="rotate(-8 263 656)" />

      {/* Collection sack */}
      <path d="M352 700 C 344 664 366 640 392 640 C 418 640 440 664 432 700 Z" fill="#035e5a" />
      <path d="M372 642 C 380 630 404 630 412 642" stroke="#7bd9d0" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Depth wash at the very bottom so the caption stays readable */}
      <rect y="600" width="520" height="120" fill="url(#auth-deep)" opacity="0.18" />
    </svg>
  );
}

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

        {/* Picture side */}
        <aside className="tl-auth-aside">
          {/* Sticky, so a long form scrolls past a picture that keeps its proportions. */}
          <div className="tl-auth-aside-sticky">
            <CoastPanelScene />
            <div className="tl-auth-aside-body">
              <span className="tl-auth-pill">
                <Icon name="waves-horizontal" size="xs" color="var(--tide-300)" />
                Sri Lanka&rsquo;s coastline
            </span>
            <h2>Every cleanup starts with someone noticing.</h2>
              <p>
                Report a polluted stretch of coast, let the community confirm it, and watch it become a cleanup
                the authorities have signed off on.
              </p>
              <ul className="tl-auth-points">
                <li>
                  <Icon name="badge-check" size="sm" color="var(--tide-300)" />
                  Community-verified reports
                </li>
                <li>
                  <Icon name="shield-check" size="sm" color="var(--tide-300)" />
                  Reviewed by MEPA officers
                </li>
                <li>
                  <Icon name="anchor" size="sm" color="var(--tide-300)" />
                  Volunteers and divers alerted nearby
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
