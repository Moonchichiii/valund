import axios, { type InternalAxiosRequestConfig } from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
export const API_ORIGIN = typeof apiUrl === 'string' ? apiUrl : 'http://localhost:8000';

// For JWT auth endpoints (/api/auth/)
export const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api/auth`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For identity endpoints (/auth/) and other root endpoints
export const rootClient = axios.create({
  baseURL: API_ORIGIN,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let ACCESS_TOKEN: string | null = null;

export const setAccessToken = (token: string | null): void => {
  ACCESS_TOKEN = token;
};

export const getAccessToken = (): string | null => ACCESS_TOKEN;

const attachAuth = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (ACCESS_TOKEN) {
    config.headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }
  return config;
};

apiClient.interceptors.request.use(attachAuth);
rootClient.interceptors.request.use(attachAuth);
