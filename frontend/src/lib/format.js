/** The API returns enum names in upper case; StatusBadge keys are lower case. */
export const statusKey = (status) => String(status || '').toLowerCase();

export const SEVERITY_LABEL = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const SEVERITY_VAR = {
  LOW: '--severity-low',
  MEDIUM: '--severity-medium',
  HIGH: '--severity-high',
  CRITICAL: '--severity-critical',
};

export const CERTIFICATION_LABEL = {
  OPEN_WATER: 'Open Water',
  ADVANCED_OPEN_WATER: 'Advanced Open Water',
  RESCUE_DIVER: 'Rescue Diver',
  DIVEMASTER: 'Divemaster',
  INSTRUCTOR: 'Instructor',
};

export const ORGANIZATION_LABEL = {
  NGO: 'NGO',
  TOURISM: 'Tourism',
  MARINE_INSTITUTION: 'Marine institution',
};

export const ROLE_LABEL = {
  CITIZEN: 'Community member',
  DIVER: 'Volunteer diver',
  ORGANIZATION: 'Organisation',
  AUTHORITY: 'Authority officer',
  ADMIN: 'Administrator',
};

export const PROJECT_STATUS_LABEL = { PLANNED: 'Planned', ACTIVE: 'Active', COMPLETED: 'Completed' };
export const PROJECT_STATUS_TONE = { PLANNED: 'neutral', ACTIVE: 'accent', COMPLETED: 'success' };

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function formatDate(iso, withYear = true) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : null),
  });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

export function locationLine(item) {
  return [item?.locationName, item?.province].filter(Boolean).join(' · ');
}

/** Sri Lanka's coastal provinces — the regions this system covers. */
export const PROVINCES = [
  'Western Province',
  'Southern Province',
  'Eastern Province',
  'Northern Province',
  'North Western Province',
];

export const CERTIFICATION_OPTIONS = Object.entries(CERTIFICATION_LABEL).map(([value, label]) => ({ value, label }));

/** Worded for the diver who applied. */
export const APPLICATION_STATUS = {
  PENDING: { label: 'Application sent', tone: 'accent' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  DECLINED: { label: 'Not selected', tone: 'neutral' },
};
