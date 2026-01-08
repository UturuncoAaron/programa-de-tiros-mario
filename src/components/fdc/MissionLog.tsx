interface LogTiro {
    id: number;
    hora: string;
    tipo: 'SALVA' | 'REGLAJE';
    detalle: string;
    coords: string;
}

export function MissionLog({ logs }: { logs: LogTiro[] }) {
    return (
        <div className="sidebar-section flexible-height history-container-styled" style={{ maxHeight: '150px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="section-label">ÚLTIMOS TIROS</label>
            </div>

            <div className="history-list-styled" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                {logs.length === 0 ? (
                    <div className="history-placeholder">Esperando disparo...</div>
                ) : (
                    logs.map(h => (
                        <div key={h.id} className="history-row-styled">
                            <span className="hist-id">#{h.id}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span style={{ fontSize: '0.65rem', color: '#fff' }}>{h.detalle}</span>
                                <span style={{ fontSize: '0.55rem', color: '#666' }}>{h.coords}</span>
                            </div>
                            <span className="hist-status">{h.tipo.substring(0, 3)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}