const API_BASE_URL = 'https://smart-life-os.onrender.com';
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

export const apiFetch = (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SECRET_KEY}`,
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  return fetch(url, { ...options, headers });
};