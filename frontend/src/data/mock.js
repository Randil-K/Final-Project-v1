export const currentUser = {
  id: 'u1',
  name: 'Sanduni Perera',
  role: 'diver', // citizen | diver | authority | admin | organization
  avatar: null,
  location: 'Negombo · Western Province',
  email: 'sanduni.perera@example.lk',
  phone: '+94 77 123 4567',
  diver: {
    certification: 'PADI Advanced Open Water',
    experience: '4 years',
    equipment: 'Own BCD, regulator, wetsuit',
    regions: ['Western Province', 'North Western Province'],
    available: true,
  },
};

export const stats = {
  reportedSites: 214,
  verifiedIncidents: 168,
  activeProjects: 12,
  completedProjects: 47,
  volunteers: 892,
};

export const regionTrends = [
  { region: 'Negombo', value: 42 },
  { region: 'Galle Fort', value: 35 },
  { region: 'Unawatuna', value: 28 },
  { region: 'Trincomalee', value: 24 },
  { region: 'Mount Lavinia', value: 19 },
  { region: 'Kalpitiya', value: 14 },
];

export const reports = [
  {
    id: 'r1',
    ref: '#SR-2481',
    title: 'Plastic debris along the tideline near the fish market',
    location: { name: 'Negombo', province: 'Western Province' },
    severity: 'high',
    status: 'verifying',
    submittedBy: 'Kasun Silva',
    submittedAt: '2026-09-08T07:20:00+05:30',
    photos: 3,
    description:
      'Large drift of plastic packaging and net fragments washed up after the weekend tide, roughly 80m stretch near the fish market jetty.',
    votesTrue: 29,
    votesFalse: 4,
    comments: [
      { id: 'c1', author: 'Nimali T.', text: 'Confirmed — walked past this morning, it is worse at low tide.' },
      { id: 'c2', author: 'Ravindu J.', text: 'Same debris pattern as last month’s report near the boatyard.' },
    ],
  },
  {
    id: 'r2',
    ref: '#SR-2477',
    title: 'Oil sheen and dead fish near the harbour outflow',
    location: { name: 'Trincomalee', province: 'Eastern Province' },
    severity: 'critical',
    status: 'escalated',
    submittedBy: 'Achini Fernando',
    submittedAt: '2026-09-06T16:45:00+05:30',
    photos: 5,
    description:
      'Visible oil sheen spreading from the harbour outflow pipe, several dead fish observed along a 40m stretch of shoreline.',
    votesTrue: 51,
    votesFalse: 2,
    comments: [
      { id: 'c1', author: 'Officer D. Bandara (MEPA)', text: 'Escalated for site inspection. Coastal Conservation Department notified.' },
    ],
  },
  {
    id: 'r3',
    ref: '#SR-2469',
    title: 'Discarded fishing nets tangled on the reef edge',
    location: { name: 'Kalpitiya', province: 'North Western Province' },
    severity: 'medium',
    status: 'verified',
    submittedBy: 'Sanduni Perera',
    submittedAt: '2026-09-04T10:05:00+05:30',
    photos: 4,
    description:
      'Ghost nets caught on the reef edge, roughly 15m from the dive site mooring. Needs diver support to remove safely.',
    votesTrue: 33,
    votesFalse: 1,
    comments: [],
  },
  {
    id: 'r4',
    ref: '#SR-2455',
    title: 'Household waste dumped behind the dune vegetation',
    location: { name: 'Mount Lavinia', province: 'Western Province' },
    severity: 'low',
    status: 'pending',
    submittedBy: 'Ishara Gunawardena',
    submittedAt: '2026-09-09T18:30:00+05:30',
    photos: 2,
    description: 'Small pile of household waste bags left behind the dune grass, likely dumped overnight.',
    votesTrue: 6,
    votesFalse: 3,
    comments: [],
  },
  {
    id: 'r5',
    ref: '#SR-2440',
    title: 'Coral bleaching patch cleared of debris',
    location: { name: 'Unawatuna', province: 'Southern Province' },
    severity: 'medium',
    status: 'cleaned',
    submittedBy: 'Tharindu Wickrama',
    submittedAt: '2026-08-28T09:00:00+05:30',
    photos: 6,
    description: 'Community cleanup completed — 38kg of debris removed from the bleaching patch near the main dive point.',
    votesTrue: 47,
    votesFalse: 0,
    comments: [],
  },
];

export function trustPct(r) {
  const total = r.votesTrue + r.votesFalse;
  if (!total) return 0;
  return Math.round((r.votesTrue / total) * 100);
}

export const projects = [
  {
    id: 'p1',
    title: 'Negombo fish market shoreline cleanup',
    ref: '#CP-118',
    location: { name: 'Negombo', province: 'Western Province' },
    status: 'active',
    completion: 62,
    volunteers: 24,
    divers: 3,
    startedAt: '2026-09-09',
    updates: [
      { id: 'u1', date: '2026-09-09', note: 'Project approved by MEPA, volunteer mobilization opened.', stage: 'before' },
      { id: 'u2', date: '2026-09-10', note: '38 bags of plastic collected on day one.', stage: 'during' },
    ],
  },
  {
    id: 'p2',
    title: 'Trincomalee harbour outflow response',
    ref: '#CP-115',
    location: { name: 'Trincomalee', province: 'Eastern Province' },
    status: 'active',
    completion: 30,
    volunteers: 11,
    divers: 5,
    startedAt: '2026-09-07',
    updates: [{ id: 'u1', date: '2026-09-07', note: 'Hazard containment underway with MEPA supervision.', stage: 'before' }],
  },
  {
    id: 'p3',
    title: 'Unawatuna reef edge net removal',
    ref: '#CP-109',
    location: { name: 'Unawatuna', province: 'Southern Province' },
    status: 'completed',
    completion: 100,
    volunteers: 9,
    divers: 6,
    startedAt: '2026-08-20',
    updates: [
      { id: 'u1', date: '2026-08-20', note: 'Ghost nets located and marked by dive team.', stage: 'before' },
      { id: 'u2', date: '2026-08-22', note: '4 nets removed, reef surveyed for damage.', stage: 'during' },
      { id: 'u3', date: '2026-08-24', note: '38kg of debris recovered, no reef damage found.', stage: 'after' },
    ],
  },
];

export const opportunities = [
  {
    id: 'o1',
    org: 'Blue Resurgence NGO',
    orgType: 'NGO',
    title: 'Reef survey diver — 3 day assignment',
    region: 'Southern Province',
    certRequired: 'Advanced Open Water',
    paid: true,
    description: 'Support a coral health survey following last month’s cleanup at Unawatuna.',
  },
  {
    id: 'o2',
    org: 'Mirissa Dive Collective',
    orgType: 'Tourism',
    title: 'Ghost net recovery volunteer',
    region: 'Southern Province',
    certRequired: 'Open Water',
    paid: false,
    description: 'Weekend volunteer dive to recover nets flagged in report #SR-2469.',
  },
  {
    id: 'o3',
    org: 'National Aquatic Research Agency',
    orgType: 'Marine institution',
    title: 'Water quality sampling diver',
    region: 'Western Province',
    certRequired: 'Rescue Diver',
    paid: true,
    description: 'Monthly sampling near the Negombo outflow, ongoing contract.',
  },
];

export const alerts = [
  {
    id: 'a1',
    title: 'New cleanup planned within 6 km of you',
    body: 'Negombo fish market shoreline cleanup starts Saturday 7:00 AM — 24 volunteers already confirmed.',
    time: '2 hours ago',
    read: false,
    kind: 'project',
  },
  {
    id: 'a2',
    title: 'Your report was verified',
    body: '#SR-2469 passed the 75% community threshold and has moved to Verified.',
    time: '1 day ago',
    read: false,
    kind: 'verified',
  },
  {
    id: 'a3',
    title: 'Alert radius widened — divers needed',
    body: 'No response yet for the Trincomalee harbour outflow response. Alert extended to Eastern Province.',
    time: '2 days ago',
    read: true,
    kind: 'escalation',
  },
  {
    id: 'a4',
    title: 'New opportunity matches your certification',
    body: 'Blue Resurgence NGO posted a 3 day reef survey assignment in Southern Province.',
    time: '3 days ago',
    read: true,
    kind: 'opportunity',
  },
];
