/**
 * API service layer.
 * Base URL auto-detects from window.location so it works from any device on the LAN.
 * Optional PIN is read from localStorage: set via PIN_KEY.
 */
import axios from 'axios';

export const BASE_URL = window.location.origin;
export const PIN_KEY = 'kumanda_pin';

const api = axios.create({ baseURL: BASE_URL });

// Attach PIN header if set
api.interceptors.request.use((config) => {
    const pin = localStorage.getItem(PIN_KEY);
    if (pin) config.headers['X-PIN'] = pin;
    return config;
});

// ── Audio ─────────────────────────────────────────────────────────────────
export const getAudioStatus = () => api.get('/api/audio/status').then(r => r.data);
export const setVolume = (level) => api.post('/api/audio/volume', { level }).then(r => r.data);
export const toggleMute = () => api.post('/api/audio/mute').then(r => r.data);
export const mediaPlayPause = () => api.post('/api/audio/media/playpause').then(r => r.data);
export const mediaNext = () => api.post('/api/audio/media/next').then(r => r.data);
export const mediaPrev = () => api.post('/api/audio/media/prev').then(r => r.data);


// ── Display ───────────────────────────────────────────────────────────────
export const getDisplayStatus = () => api.get('/api/display/status').then(r => r.data);
export const setBrightness = (level) => api.post('/api/display/brightness', { level }).then(r => r.data);

export default api;
