import { request, requestBlob } from './client.js';

function query(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      search.append(key, value);
    }
  });
  const string = search.toString();
  return string ? `?${string}` : '';
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    /** Multipart: the account details as a JSON "data" part, plus any certificate files. */
    register: (data, certificates = []) => {
      const form = new FormData();
      form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
      certificates.forEach((file) => form.append('certificates', file));
      return request('/api/auth/register', { method: 'POST', body: form, auth: false });
    },
  },

  users: {
    me: () => request('/api/users/me'),
    updateProfile: (payload) => request('/api/users/me', { method: 'PUT', body: payload }),
    updateDiverProfile: (payload) =>
      request('/api/users/me/diver-profile', { method: 'PUT', body: payload }),
  },

  reports: {
    list: (params) => request(`/api/reports${query(params)}`, { auth: false }),
    get: (id) => request(`/api/reports/${id}`, { auth: false }),
    create: (payload, evidence = []) => {
      const form = new FormData();
      form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      evidence.forEach((file) => form.append('evidence', file));
      return request('/api/reports', { method: 'POST', body: form });
    },
    vote: (id, confirmed) =>
      request(`/api/reports/${id}/votes`, { method: 'POST', body: { confirmed } }),
    comments: (id) => request(`/api/reports/${id}/comments`),
    comment: (id, bodyText, parentId = null) =>
      request(`/api/reports/${id}/comments`, { method: 'POST', body: { body: bodyText, parentId } }),
    react: (id, commentId, type) =>
      request(`/api/reports/${id}/comments/${commentId}/reactions`, { method: 'POST', body: { type } }),
    /** decision: APPROVED (sends it to the authority), REJECTED or MORE_INFO_REQUESTED. */
    moderate: (id, decision, comment) =>
      request(`/api/reports/${id}/moderation`, { method: 'POST', body: { decision, comment } }),
    /** decision: APPROVED (creates the project), REJECTED or MORE_INFO_REQUESTED. */
    authorityDecision: (id, decision, comment) =>
      request(`/api/reports/${id}/authority-decision`, { method: 'POST', body: { decision, comment } }),
    widenAlert: (id) => request(`/api/reports/${id}/alert-escalation`, { method: 'POST' }),
  },

  projects: {
    // Public, but sending the token lets the API report whether the viewer has joined.
    list: (params) => request(`/api/projects${query(params)}`),
    get: (id) => request(`/api/projects/${id}`),
    join: (id, participantRole) =>
      request(`/api/projects/${id}/participants`, { method: 'POST', body: { participantRole } }),
    addUpdate: (id, payload) =>
      request(`/api/projects/${id}/updates`, { method: 'POST', body: payload }),
    mark: (id, participantId, mark) =>
      request(`/api/projects/${id}/participants/${participantId}/mark`, { method: 'POST', body: { mark } }),
  },

  alerts: {
    list: () => request('/api/alerts'),
    unreadCount: () => request('/api/alerts/unread-count'),
    markRead: (id) => request(`/api/alerts/${id}/read`, { method: 'POST' }),
    markAllRead: () => request('/api/alerts/read-all', { method: 'POST' }),
  },

  opportunities: {
    list: () => request('/api/opportunities'),
    create: (payload) => request('/api/opportunities', { method: 'POST', body: payload }),
    myApplications: () => request('/api/opportunities/applications/mine'),
    apply: (id, message) =>
      request(`/api/opportunities/${id}/applications`, { method: 'POST', body: { message } }),
    applications: (id) => request(`/api/opportunities/${id}/applications`),
    decide: (applicationId, status) =>
      request(`/api/opportunities/applications/${applicationId}/decision`, { method: 'POST', body: { status } }),
  },

  admin: {
    users: (search) => request(`/api/admin/users${query({ query: search })}`),
    setSuspension: (id, suspended, reason) =>
      request(`/api/admin/users/${id}/suspension`, { method: 'POST', body: { suspended, reason } }),
    verifications: (status) => request(`/api/admin/verifications${query({ status })}`),
    reviewAccount: (id, approved, reason) =>
      request(`/api/admin/verifications/${id}`, { method: 'POST', body: { approved, reason } }),
    document: (id) => requestBlob(`/api/admin/documents/${id}`),
  },

  analytics: {
    summary: () => request('/api/analytics/summary', { auth: false }),
  },
};
