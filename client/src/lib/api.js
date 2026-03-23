const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body }),
    login:    (body) => request('/auth/login',    { method: 'POST', body }),
    me:       ()     => request('/auth/me'),
  },
  rooms: {
    list:   ()      => request('/rooms'),
    get:    (id)    => request(`/rooms/${id}`),
    create: (body)  => request('/rooms', { method: 'POST', body }),
    invite: (id, body) => request(`/rooms/${id}/invite`, { method: 'POST', body }),
  },
};
