import React, { useEffect, useRef, useState } from 'react';
import { mouseWS } from '../services/ws';

/**
 * MousepadPage – full-screen touch surface for mouse control via WebSocket.
 *
 * Gestures:
 *   1 finger drag   → move cursor (relative)
 *   1 finger tap    → left click
 *   2 finger tap    → right click
 *   2 finger swipe  → scroll (vertical)
 */

const SENSITIVITY = 1.8; // Multiply touch delta
const SCROLL_SENSITIVITY = 0.4; // Increased 5x for natural feel
const TAP_MAX_MOVE = 8;    // px – above this is a drag, not a tap
const TAP_MAX_TIME = 200;  // ms

export default function MousepadPage() {
    const padRef = useRef(null);
    const touchDataRef = useRef(null); // stores start info
    const [connected, setConnected] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // ── WebSocket lifecycle ───────────────────────────────────────────────
    useEffect(() => {
        mouseWS.connect();

        const interval = setInterval(() => {
            setConnected(mouseWS.isConnected());
        }, 800);

        return () => {
            clearInterval(interval);
            mouseWS.disconnect();
        };
    }, []);

    const flash = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 600);
    };

    // ── Touch handlers ────────────────────────────────────────────────────
    const onTouchStart = (e) => {
        const touches = Array.from(e.touches);
        touchDataRef.current = {
            fingers: touches.length,
            startTime: Date.now(),
            startPos: touches.map(t => ({ x: t.clientX, y: t.clientY })),
            lastPos: touches.map(t => ({ x: t.clientX, y: t.clientY })),
            moved: false,
        };
    };

    const onTouchMove = (e) => {
        e.preventDefault(); // prevent scroll
        const td = touchDataRef.current;
        if (!td) return;
        const touches = Array.from(e.touches);

        if (touches.length === 1 && td.fingers === 1) {
            // Single-finger move → cursor movement
            const dx = (touches[0].clientX - td.lastPos[0].x) * SENSITIVITY;
            const dy = (touches[0].clientY - td.lastPos[0].y) * SENSITIVITY;
            td.lastPos[0] = { x: touches[0].clientX, y: touches[0].clientY };

            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist > 1) td.moved = true;

            mouseWS.send({ type: 'move', dx: Math.round(dx), dy: Math.round(dy) });

        } else if (touches.length === 2 && td.fingers === 2) {
            // Two-finger → scroll
            const dy0 = touches[0].clientY - td.lastPos[0].y;
            const dy1 = touches[1].clientY - td.lastPos[1].y;
            const avgDy = (dy0 + dy1) / 2;

            td.lastPos = [
                { x: touches[0].clientX, y: touches[0].clientY },
                { x: touches[1].clientX, y: touches[1].clientY },
            ];

            if (Math.abs(avgDy) > 0.5) {
                td.moved = true;
                const scrollAmt = Math.round(avgDy * SCROLL_SENSITIVITY * 10);
                if (scrollAmt !== 0) mouseWS.send({ type: 'scroll', dy: scrollAmt });
            }
        }
    };

    const onTouchEnd = (e) => {
        const td = touchDataRef.current;
        if (!td) return;

        const elapsed = Date.now() - td.startTime;
        const wasTap = !td.moved && elapsed < TAP_MAX_TIME;

        if (wasTap) {
            if (td.fingers === 1) {
                mouseWS.send({ type: 'click', button: 'left' });
                flash('👆 Click');
            } else if (td.fingers === 2) {
                mouseWS.send({ type: 'click', button: 'right' });
                flash('👇 Right click');
            }
        }

        touchDataRef.current = null;
    };

    const sendClick = (button) => {
        mouseWS.send({ type: 'click', button });
        flash(button === 'left' ? '👆 Left' : '👉 Right');
    };

    const sendScroll = (dir) => {
        mouseWS.send({ type: 'scroll', dy: dir * 8 });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Status bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 6px',
                background: 'var(--bg-1)',
            }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.2rem' }}>Mousepad</h1>
                </div>
                <div className="status-row">
                    <span className={`dot ${connected ? '' : 'inactive'}`} />
                    <span style={{ fontSize: '0.78rem' }}>{connected ? 'Connected' : 'Connecting…'}</span>
                </div>
            </div>

            {/* Touch Surface */}
            <div
                ref={padRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    touchAction: 'none',
                    cursor: 'crosshair',
                }}
            >
                {/* Center crosshair decoration */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 60, height: 60,
                    borderRadius: '50%',
                    border: '1px dashed var(--border)',
                    pointerEvents: 'none',
                    opacity: 0.4,
                }} />
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: 'var(--border)',
                    pointerEvents: 'none',
                    opacity: 0.5,
                }} />

                {/* Gesture hint */}
                <div style={{
                    position: 'absolute', bottom: 16, left: 0, right: 0,
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                }}>
                    1 finger = move · tap = click · 2 fingers = scroll/right-click
                </div>

                {/* Feedback flash */}
                {feedback && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(124,107,255,0.2)',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent-light)',
                        padding: '10px 24px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        pointerEvents: 'none',
                        animation: 'toast-in 0.1s ease',
                    }}>
                        {feedback}
                    </div>
                )}
            </div>

            {/* Button row */}
            <div style={{
                display: 'flex',
                gap: 12,
                padding: '12px 16px',
                paddingBottom: 'calc(var(--nav-height) + 12px)',
                background: 'var(--bg-1)',
                borderTop: '1px solid var(--border)',
            }}>
                <button
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '14px', fontSize: '1rem', gap: 8 }}
                    onClick={() => sendClick('left')}
                >
                    ◀ Left
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => sendScroll(1)}
                    >▲</button>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => sendScroll(-1)}
                    >▼</button>
                </div>
                <button
                    className="btn btn-ghost"
                    style={{ flex: 1, padding: '14px', fontSize: '1rem', gap: 8 }}
                    onClick={() => sendClick('right')}
                >
                    Right ▶
                </button>
            </div>
        </div>
    );
}
