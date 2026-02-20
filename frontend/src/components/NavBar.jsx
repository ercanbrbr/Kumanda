import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/audio', icon: '🔊', label: 'Audio' },
    { to: '/display', icon: '💡', label: 'Display' },
    { to: '/mousepad', icon: '🖱️', label: 'Mousepad' },
];

export default function NavBar() {
    return (
        <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            height: 'var(--nav-height)',
            background: 'rgba(17,17,24,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            zIndex: 100,
        }}>
            {navItems.map(({ to, icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    style={({ isActive }) => ({
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                        color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                        transition: 'color var(--transition)',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    })}
                >
                    {({ isActive }) => (
                        <>
                            <span style={{
                                fontSize: '1.4rem',
                                filter: isActive ? 'drop-shadow(0 0 8px var(--accent))' : 'none',
                                transition: 'filter var(--transition)',
                            }}>
                                {icon}
                            </span>
                            <span>{label}</span>
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    width: '32px',
                                    height: '3px',
                                    background: 'var(--accent)',
                                    borderRadius: '3px 3px 0 0',
                                    boxShadow: '0 0 8px var(--accent)',
                                }} />
                            )}
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
