import React from 'react';
import { Icon, Input } from '../design-system';

/**
 * A password field with a show/hide toggle, so someone can check what they have typed before
 * committing to it. Starts hidden, and goes back to hidden on every fresh render of the page.
 */
export default function PasswordInput({ label = 'Password', ...rest }) {
  const [visible, setVisible] = React.useState(false);

  return (
    <Input
      {...rest}
      label={label}
      type={visible ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 4,
            margin: -4,
            borderRadius: 'var(--radius-sm, 6px)',
          }}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size="sm" color="var(--text-muted)" />
        </button>
      }
    />
  );
}
