import { request } from './client.js';

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
    register: (payload) =>
      request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
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
    create: (payload) => request('/api/reports', { method: 'POST', body: payload }),
    vote: (id, confirmed) =>
      request(`/api/reports/${id}/votes`, { method: 'POST', body: { confirmed } }),
    comments: (id) => request(`/api/reports/${id}/comments`),
    comment: (id, bodyText) =>
      request(`/api/reports/${id}/comments`, { method: 'POST', body: { body: bodyText } }),
    moderate: (id, status, comment) =>
      request(`/api/reports/${id}/moderation`, { method: 'POST', body: { status, comment } }),
    escalate: (id) => request(`/api/reports/${id}/escalation`, { method: 'POST' }),
    authorityDecision: (id, approved, comment) =>
      request(`/api/reports/${id}/authority-decision`, {
        method: 'POST',
        body: { approved, comment },
      }),
    widenAlert: (id) => request(`/api/reports/${id}/alert-escalation`, { method: 'POST' }),
  },

  projects: {
    list: (params) => request(`/api/projects${query(params)}`, { auth: false }),
    get: (id) => request(`/api/projects/${id}`, { auth: false }),
    create: (payload) => request('/api/projects', { method: 'POST', body: payload }),
    join: (id, participantRole) =>
      request(`/api/projects/${id}/participants`, { method: 'POST', body: { participantRole } }),
    addUpdate: (id, payload) =>
      request(`/api/projects/${id}/updates`, { method: 'POST', body: payload }),
  },

  alerts: {
    list: () => request('/api/alerts'),
    markRead: (id) => request(`/api/alerts/${id}/read`, { method: 'POST' }),
  },

  opportunities: {
    list: () => request('/api/opportunities'),
    myApplications: () => request('/api/opportunities/applications/mine'),
    apply: (id, message) =>
      request(`/api/opportunities/${id}/applications`, { method: 'POST', body: { message } }),
  },

  analytics: {
    summary: () => request('/api/analytics/summary', { auth: false }),
  },
};
