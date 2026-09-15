import React from 'react';
import { Alert, Badge, Button, IconButton, Input } from '../design-system';
import { api } from '../api/index.js';
import { formatDate } from '../lib/format.js';

const emptyLine = () => ({ name: '', quantity: '' });

function planFrom(project) {
  const resources = project.resources;
  return {
    volunteersNeeded: resources?.volunteersNeeded ?? '',
    diversNeeded: resources?.diversNeeded ?? '',
    equipment: resources?.equipment?.length
      ? resources.equipment.map((item) => ({ name: item.name, quantity: String(item.quantity) }))
      : [emptyLine()],
  };
}

/** Administrators turn the government officer's approval note into the resources a project needs. */
export default function ResourcePlanner({ project, onSaved }) {
  const [plan, setPlan] = React.useState(() => planFrom(project));
  const [busy, setBusy] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const finalized = Boolean(project.resources?.finalized);

  const setLine = (index, key, value) =>
    setPlan((p) => ({ ...p, equipment: p.equipment.map((line, i) => (i === index ? { ...line, [key]: value } : line)) }));

  async function save(publish) {
    setError(null);
    setNotice(null);
    const equipment = plan.equipment
      .filter((line) => line.name.trim() || line.quantity)
      .map((line) => ({ name: line.name.trim(), quantity: Number(line.quantity) }));
    if (equipment.some((line) => !line.name || !(line.quantity >= 1))) {
      setError('Give every equipment item a name and a quantity of at least 1.');
      return;
    }
    setBusy(publish ? 'publish' : 'draft');
    try {
      const updated = await api.projects.updateResources(project.id, {
        volunteersNeeded: plan.volunteersNeeded === '' ? 0 : Number(plan.volunteersNeeded),
        diversNeeded: plan.diversNeeded === '' ? 0 : Number(plan.diversNeeded),
        equipment,
        publish,
      });
      onSaved(updated);
      setNotice(publish ? 'Resources finalized and shown on the project.' : 'Draft saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Assign resources</span>
        <Badge tone={finalized ? 'success' : 'warning'} size="sm">{finalized ? 'Finalized' : 'Not finalized'}</Badge>
      </div>

      {project.approval ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', borderLeft: '3px solid var(--danger)' }}>
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-muted)' }}>
            Official comment · {project.approval.officer?.fullName} · {formatDate(project.approval.decidedAt)}
          </span>
          <span style={{ font: 'var(--text-body)', color: 'var(--text-heading)', whiteSpace: 'pre-wrap' }}>{project.approval.comment}</span>
        </div>
      ) : null}

      {notice ? <Alert tone="success" title="Saved" onDismiss={() => setNotice(null)}>{notice}</Alert> : null}
      {error ? <Alert tone="danger" title="Not saved" onDismiss={() => setError(null)}>{error}</Alert> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <Input
          label="Volunteers needed"
          type="number"
          min="0"
          max="1000"
          iconLeft="users"
          value={plan.volunteersNeeded}
          onChange={(e) => setPlan((p) => ({ ...p, volunteersNeeded: e.target.value }))}
        />
        <Input
          label="Divers needed"
          type="number"
          min="0"
          max="1000"
          iconLeft="anchor"
          value={plan.diversNeeded}
          onChange={(e) => setPlan((p) => ({ ...p, diversNeeded: e.target.value }))}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--text-heading)' }}>Equipment</span>
        {plan.equipment.map((line, index) => (
          <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
            <Input
              placeholder="e.g. Heavy-duty gloves"
              aria-label={`Equipment ${index + 1}`}
              value={line.name}
              onChange={(e) => setLine(index, 'name', e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              type="number"
              min="1"
              max="1000"
              placeholder="Qty"
              aria-label={`Quantity ${index + 1}`}
              value={line.quantity}
              onChange={(e) => setLine(index, 'quantity', e.target.value)}
              style={{ width: 100 }}
            />
            <IconButton
              icon="trash"
              label={`Remove equipment ${index + 1}`}
              onClick={() => setPlan((p) => ({ ...p, equipment: p.equipment.length > 1 ? p.equipment.filter((_, i) => i !== index) : [emptyLine()] }))}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          iconLeft="plus"
          disabled={plan.equipment.length >= 30}
          onClick={() => setPlan((p) => ({ ...p, equipment: [...p.equipment, emptyLine()] }))}
          style={{ alignSelf: 'flex-start' }}
        >
          Add equipment
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {!finalized ? (
          <Button variant="secondary" disabled={Boolean(busy)} onClick={() => save(false)}>
            {busy === 'draft' ? 'Saving…' : 'Save draft'}
          </Button>
        ) : null}
        <Button iconLeft="check" disabled={Boolean(busy)} onClick={() => save(true)}>
          {busy === 'publish' ? 'Saving…' : finalized ? 'Update resources' : 'Finalize resources'}
        </Button>
      </div>
    </div>
  );
}
