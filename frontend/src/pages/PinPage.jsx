import React, { useState } from 'react';
import { PIN_KEY } from '../services/api';

/**
 * PinPage – shown on first visit if server requires a PIN.
 * Saves the entered PIN to localStorage so subsequent requests include it.
 * Props:
 *   onUnlock(pin) – called once the user submits a PIN
 */
export default function PinPage({ onUnlock }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);

    const tryPin = async (e) => {
        e.preventDefault();
        if (!pin.trim()) return;
        setChecking(true);
        setError('');

        try {
            // Test the PIN against the health endpoint
            const res = await fetch('/health', {
                headers: pin ? { 'X-PIN': pin } : {},
            });

            if (res.ok) {
                localStorage.setItem(PIN_KEY, pin);
                onUnlock(pin);
            } else if (res.status === 401) {
                setError('Wrong PIN – try again.');
            } else {
                setError(`Server error ${res.status}`);
            }
        } catch {
            setError('Cannot reach server. Is the backend running?');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '100dvh',
            padding: 32,
            background: 'var(--bg-0)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎮</div>
                <h1 style={{
                    fontSize: '1.8rem', fontWeight: 700,
                    color: 'var(--text-primary)', margin: 0,
                }}>Kumanda</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Enter PIN to continue</p>
            </div>

            <form onSubmit={tryPin} style={{ width: '100%', maxWidth: 320 }}>
                <input
                    type="number"
                    inputMode="numeric"
                    placeholder="PIN"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '18px 20px',
                        background: 'var(--bg-2)',
                        border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        color: 'var(--text-primary)',
                        fontSize: '1.4rem',
                        letterSpacing: '0.25em',
                        textAlign: 'center',
                        outline: 'none',
                        marginBottom: 12,
                        boxSizing: 'border-box',
                        // Hide number arrows
                        MozAppearance: 'textfield',
                    }}
                />
                {error && (
                    <p style={{
                        color: 'var(--danger)', fontSize: '0.85rem',
                        textAlign: 'center', margin: '0 0 12px',
                    }}>{error}</p>
                )}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={checking || !pin.trim()}
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                >
                    {checking ? 'Checking…' : 'Unlock'}
                </button>
            </form>
        </div>
    );
}
