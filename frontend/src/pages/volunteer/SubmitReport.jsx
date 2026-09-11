import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, IconButton, Button, Input, Textarea, Select, FileDrop, Alert } from '../../design-system';

export default function SubmitReport() {
  const navigate = useNavigate();
  const [files, setFiles] = React.useState([]);
  const [located, setLocated] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  function pickFiles() {
    setFiles((f) => [...f, `evidence-${f.length + 1}.jpg`]);
  }

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center', padding: 'var(--space-16) var(--space-4)' }}>
        <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-verified-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="badge-check" size="xl" color="var(--status-verified)" />
        </span>
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Report submitted</h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-body-color)', maxWidth: 320 }}>
          Thanks — the community can now vote on your report. You'll get an alert when its status changes.
        </p>
        <Button onClick={() => navigate('/app')}>Back to feed</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="chevron-left" label="Back" onClick={() => navigate(-1)} />
        <h1 style={{ font: 'var(--text-h2)', color: 'var(--text-strong)' }}>Report pollution</h1>
      </div>

      <FileDrop label="Evidence" required hint="Add at least one photo — reports with evidence are verified about twice as fast." files={files} onPick={pickFiles} />

      <Input label="Location" required suffix={located ? 'Located' : undefined} iconLeft="map-pin" placeholder="Tap to capture your GPS location" readOnly value={located ? 'Negombo, Western Province · 7.2083° N, 79.8358° E' : ''} onClick={() => setLocated(true)} />

      <Select label="Severity" required placeholder="How severe does this look?" options={[
        { value: 'low', label: 'Low — small, isolated debris' },
        { value: 'medium', label: 'Medium — noticeable, spreading' },
        { value: 'high', label: 'High — large area, harmful materials' },
        { value: 'critical', label: 'Critical — active spill or hazard' },
      ]} />

      <Textarea label="Description" required rows={4} maxLength={400} placeholder="What did you see? Include size, materials, and anything unusual." />

      {located ? (
        <Alert tone="info" title="Nearby volunteers will be alerted">
          Once submitted, this report goes to the community for verification. Volunteers and divers within 5 km are notified first.
        </Alert>
      ) : null}

      <Button type="submit" size="lg" fullWidth iconLeft="flag">
        Submit report
      </Button>
    </form>
  );
}
