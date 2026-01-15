import React from 'react';

interface Props {
    isOnline: boolean;
    mode: 'sat' | 'radar';
    setMode: React.Dispatch<React.SetStateAction<'sat' | 'radar'>>;
    showLabels: boolean;
    setShowLabels: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MapControls({ isOnline, mode, setMode, showLabels, setShowLabels }: Props) {
    return (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: '5px' }}>
            <button onClick={() => setShowLabels(!showLabels)} title={showLabels ? "Ocultar Triángulos" : "Ver Triángulos"}
                style={{
                    background: showLabels ? 'rgba(0, 50, 0, 0.9)' : 'rgba(20, 20, 20, 0.8)', border: showLabels ? '1px solid #4dff88' : '1px solid #666',
                    color: showLabels ? '#4dff88' : '#888', padding: '5px 8px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showLabels ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>) : (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>)}
                </svg>
            </button>
            <button onClick={() => { if (isOnline) setMode(prev => prev === 'sat' ? 'radar' : 'sat'); }} disabled={!isOnline}
                style={{
                    background: isOnline ? 'rgba(0, 20, 0, 0.8)' : 'rgba(50, 0, 0, 0.8)', border: isOnline ? '1px solid #00ffcc' : '1px solid #ff3333',
                    color: isOnline ? '#00ffcc' : '#ff3333', fontFamily: 'monospace', padding: '5px 10px', cursor: isOnline ? 'pointer' : 'not-allowed', fontSize: '10px'
                }}>
                {!isOnline ? '⚠ OFFLINE' : (mode === 'sat' ? 'SAT' : 'GRID')}
            </button>
        </div>
    );
}