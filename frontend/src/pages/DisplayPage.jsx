import React, { useState, useEffect, useCallback } from 'react';
import { getDisplayStatus, setBrightness } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const PRESETS = [
    { label: '🌙 Night', value: 20 },
    { label: '📖 Read', value: 50 },
    { label: '☀️ Day', value: 80 },
    { label: '🔆 Max', value: 100 },
];

export default function DisplayPage() {
    const [brightness, setBrightnessState] = useState(80);
    const [supported, setSupported] = useState(true);
    const [loading, setLoading] = useState(true);
    const { toasts, addToast } = useToast();

    const refresh = useCallback(async () => {
        try {
            const data = await getDisplayStatus();
            setSupported(data.supported);
            if (data.supported) setBrightnessState(data.brightness);
        } catch {
            addToast('⚠️ Cannot reach server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const handleBrightness = async (level) => {
        const clamped = Math.max(0, Math.min(100, level));
        setBrightnessState(clamped);
        try {
            await setBrightness(clamped);
        } catch (e) {
            const msg = e?.response?.data?.detail || 'Failed to set brightness';
            addToast(msg);
        }
    };

    // Hue based on brightness for visual feedback
    const getBrightnessColor = (b) => {
        if (b <= 30) return 'var(--accent)';
        if (b <= 60) return 'var(--accent-amber)';
        return '#fff9c4';
    };

    return (
        <div className="page">
            <Toast toasts={toasts} />

            <div style={{ marginBottom: 28 }}>
                <h1 className="page-title">Display</h1>
                <p className="page-subtitle">Screen brightness control</p>
            </div>

            {!supported && !loading && (
                <div className="card" style={{ borderColor: 'var(--accent-amber)', background: 'var(--accent-amber-dim)' }}>
                    <p style={{ color: 'var(--accent-amber)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                        ⚠️ Brightness control is not supported on this monitor via software. This happens with most external displays. Try adjusting brightness from the monitor's physical buttons.
                    </p>
                </div>
            )}

            {/* Brightness Card */}
            <div className="card">
                <p className="card-title">Brightness</p>
                <div className="big-value">
                    <span className="number" style={{ color: getBrightnessColor(brightness) }}>
                        {brightness}
                    </span>
                    <span className="unit">%</span>
                </div>

                <div className="control-row">
                    <button
                        className="btn btn-icon"
                        onClick={() => handleBrightness(brightness - 5)}
                        style={{ fontSize: '1.3rem' }}
                    >🌑</button>

                    <input
                        type="range"
                        min={0} max={100}
                        value={brightness}
                        style={{ flex: 1 }}
                        onChange={e => setBrightnessState(Number(e.target.value))}
                        onMouseUp={e => handleBrightness(Number(e.target.value))}
                        onTouchEnd={e => handleBrightness(Number(e.target.value))}
                    />

                    <button
                        className="btn btn-icon"
                        onClick={() => handleBrightness(brightness + 5)}
                        style={{ fontSize: '1.3rem' }}
                    >☀️</button>
                </div>
            </div>

            {/* Presets */}
            <div className="card">
                <p className="card-title">Presets</p>
                <div className="chip-row">
                    {PRESETS.map(({ label, value }) => (
                        <button
                            key={value}
                            className="chip"
                            style={brightness === value ? { background: 'var(--accent-dim)', borderColor: 'var(--accent)', color: 'var(--accent-light)' } : {}}
                            onClick={() => handleBrightness(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="status-row" style={{ justifyContent: 'center' }}>
                <span className={`dot ${loading ? 'inactive' : ''}`} />
                <span>{loading ? 'Connecting…' : supported ? 'Live' : 'Limited support'}</span>
            </div>
        </div>
    );
}
