import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import NavBar from './components/NavBar';
import AudioPage from './pages/AudioPage';
import DisplayPage from './pages/DisplayPage';
import MousepadPage from './pages/MousepadPage';
import PinPage from './pages/PinPage';
import { PIN_KEY } from './services/api';

/**
 * On first mount, poke /health with no PIN.
 *   - 200 → server has no PIN configured → go straight to app
 *   - 401 → server requires PIN → show PinPage
 */
async function checkPinRequired() {
  try {
    const res = await fetch('/health');
    if (res.status === 401) return true;
    return false;
  } catch {
    return false; // can't reach server, let app handle errors
  }
}

export default function App() {
  // null = still checking, true = unlocked, false = need pin
  const [unlocked, setUnlocked] = useState(null);

  useEffect(() => {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (savedPin) {
      // Already have a PIN saved – verify it's still correct
      fetch('/health', { headers: { 'X-PIN': savedPin } }).then(res => {
        setUnlocked(res.ok);
        if (!res.ok) localStorage.removeItem(PIN_KEY); // stale pin
      }).catch(() => setUnlocked(true)); // offline, try anyway
    } else {
      // No saved PIN – check if server even needs one
      checkPinRequired().then(required => {
        setUnlocked(!required);
      });
    }
  }, []);

  if (unlocked === null) {
    // Loading splash
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--bg-0)',
        color: 'var(--text-muted)', fontSize: '1rem',
      }}>
        🎮 Kumanda…
      </div>
    );
  }

  if (!unlocked) {
    return <PinPage onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/audio" replace />} />
        <Route path="/audio" element={<AudioPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/mousepad" element={<MousepadPage />} />
      </Routes>
      <NavBar />
    </BrowserRouter>
  );
}
