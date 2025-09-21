import axios from 'axios'

export const API_ORIGIN = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
})

export const rootClient = axios.create({
  baseURL: API_ORIGIN,
  withCredentials: true,
})

let ACCESS_TOKEN: string | null = null
export const setAccessToken = (token: string | null) => { ACCESS_TOKEN = token }
export const getAccessToken = () => ACCESS_TOKEN

const attachAuth = (config: any) => {
  config.withCredentials = true
  if (ACCESS_TOKEN) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${ACCESS_TOKEN}`
  }
  return config
}

apiClient.interceptors.request.use(attachAuth)
rootClient.interceptors.request.use(attachAuth)
