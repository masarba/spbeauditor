import axios from 'axios';

const API_URL = 'https://spbebackend-production.up.railway.app/api/auth/';

export const login = (email, password) => {
  return axios.post(API_URL + 'login', {
    email,
    password,
  }).then(response => {
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data)); // Store user data in localStorage
    }
    return response.data;
  });
};

export const logout = () => {
  localStorage.removeItem('user'); // Remove user data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('is2FAVerified');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user')); // Get current user from localStorage
};

// Function to check 2FA status from the server
export const check2FAStatus = () => {
  const token = localStorage.getItem('token');
  if (!token) return Promise.resolve(false);
  
  return axios.get(API_URL + 'check-2fa-status', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(response => {
    const is2FAEnabled = response.data.is_2fa_enabled;
    localStorage.setItem('is2FAVerified', is2FAEnabled);
    return is2FAEnabled;
  }).catch(() => {
    return false;
  });
};
