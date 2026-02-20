import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    getAudioStatus, setVolume, toggleMute,
    mediaPlayPause, mediaNext, mediaPrev,
} from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

export default function AudioPage() {
    const [volume, setVolumeState] = useState(null); // null = not yet loaded
    const [muted, setMuted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sliderValue, setSliderValue] = useState(50); // local-only during drag
    const { toasts, addToast } = useToast();
    const isDragging = useRef(false);

    // ── Initial fetch ────────────────────────────────────────────────────────
    const refresh = useCallback(async () => {
        try {
            const data = await getAudioStatus();
            setVolumeState(data.volume);
            setSliderValue(data.volume);
            setMuted(data.muted);
        } catch {
            addToast('⚠️ Cannot reach server');
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => { refresh(); }, [refresh]);

    // ── Volume helpers ────────────────────────────────────────────────────────
    const applyVolume = async (level) => {
        const clamped = Math.max(0, Math.min(100, Math.round(level)));
        setVolumeState(clamped);
        setSliderValue(clamped);
        try {
            const data = await setVolume(clamped);
            setMuted(data.muted);
        } catch { addToast('Failed to set volume'); }
    };

    // Only update local slider display during drag; send to server on release
    const onSliderChange = (e) => {
        isDragging.current = true;
        setSliderValue(Number(e.target.value));
    };

    const onSliderCommit = (e) => {
        isDragging.current = false;
        applyVolume(Number(e.target.value));
    };

    const handleMute = async () => {
        try {
            const data = await toggleMute();
            setMuted(data.muted);
            setVolumeState(data.volume);
            setSliderValue(data.volume);
            addToast(data.muted ? '🔇 Muted' : '🔊 Unmuted');
        } catch { addToast('Failed to toggle mute'); }
    };

    const handleMedia = async (action, emoji) => {
        try {
            await action();
            addToast(emoji);
        } catch { addToast('Media key failed'); }
    };

    // ── Display value: use sliderValue while dragging, volume otherwise ───────
    const displayVolume = volume === null ? '–' : (isDragging.current ? sliderValue : volume);
    const disabled = loading || volume === null;

    return (
        <div className="page">
            <Toast toasts={toasts} />

            <div style={{ marginBottom: 16 }}>
                <h1 className="page-title">Audio</h1>
                <p className="page-subtitle">System volume control</p>
            </div>

            {/* Media Controls Card */}
            <div className="card" style={{ padding: '16px 24px' }}>
                <p className="card-title">Media</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <button
                        className="btn btn-icon"
                        disabled={disabled}
                        style={{ fontSize: '1.4rem', opacity: disabled ? 0.4 : 1 }}
                        onClick={() => handleMedia(mediaPrev, '⏮ Prev')}
                    >⏮</button>

                    <button
                        className="btn btn-primary"
                        disabled={disabled}
                        style={{
                            width: 64, height: 64, borderRadius: '50%',
                            fontSize: '1.5rem', padding: 0,
                            opacity: disabled ? 0.4 : 1,
                        }}
                        onClick={() => handleMedia(mediaPlayPause, '⏯ Play/Pause')}
                    >⏯</button>

                    <button
                        className="btn btn-icon"
                        disabled={disabled}
                        style={{ fontSize: '1.4rem', opacity: disabled ? 0.4 : 1 }}
                        onClick={() => handleMedia(mediaNext, '⏭ Next')}
                    >⏭</button>
                </div>
            </div>

            {/* Volume Card */}
            <div className="card" style={{ padding: '16px 24px' }}>
                <p className="card-title">Volume</p>
                <div className="big-value" style={{ marginBottom: 12 }}>
                    <span className="number" style={{
                        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontSize: '2.2rem',
                    }}>
                        {displayVolume}
                    </span>
                    {volume !== null && <span className="unit" style={{ fontSize: '1rem' }}>%</span>}
                </div>

                <div className="control-row">
                    <button
                        className="btn btn-icon"
                        disabled={disabled}
                        style={{ fontSize: '1.6rem', opacity: disabled ? 0.4 : 1 }}
                        onClick={() => applyVolume((volume ?? 50) - 5)}
                    >−</button>

                    <input
                        type="range"
                        min={0} max={100}
                        value={sliderValue}
                        disabled={disabled}
                        style={{ flex: 1, opacity: disabled ? 0.4 : 1 }}
                        onChange={onSliderChange}
                        onMouseUp={onSliderCommit}
                        onTouchEnd={onSliderCommit}
                    />

                    <button
                        className="btn btn-icon"
                        disabled={disabled}
                        style={{ fontSize: '1.6rem', opacity: disabled ? 0.4 : 1 }}
                        onClick={() => applyVolume((volume ?? 50) + 5)}
                    >+</button>
                </div>

                <div className="slider-label" style={{ marginTop: 8 }}>
                    <span>0</span><span>100</span>
                </div>
            </div>

            {/* Mute Card */}
            <div className="card">
                <p className="card-title">Mute</p>
                <button
                    className={`btn ${muted ? 'btn-mute-active' : 'btn-ghost'}`}
                    disabled={disabled}
                    style={{ width: '100%', padding: '18px', fontSize: '1.1rem', gap: 12, opacity: disabled ? 0.4 : 1 }}
                    onClick={handleMute}
                >
                    <span style={{ fontSize: '1.4rem' }}>{muted ? '🔇' : '🔊'}</span>
                    {muted ? 'Unmute' : 'Mute'}
                </button>
            </div>


            <div className="status-row" style={{ justifyContent: 'center' }}>
                <span className={`dot ${loading ? 'inactive' : ''}`} />
                <span>{loading ? 'Connecting…' : 'Live'}</span>
            </div>
        </div>
    );
}
