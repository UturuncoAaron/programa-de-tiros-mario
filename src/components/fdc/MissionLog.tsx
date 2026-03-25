import { useState, useCallback, memo } from 'react';
import type { LogTiro } from '../../types/fdc';

// ============================================================
// TIPOS
// ============================================================
interface MissionLogProps {
    logs: LogTiro[];
    onDelete: (id: number) => void;
    onEdit: (log: LogTiro) => void;
}

interface DataBoxProps {
    label: string;
    value: string | number;
    suffix?: string;
    color: string;
}

interface ConfirmDeleteModalProps {
    log: LogTiro;
    onConfirm: () => void;
    onCancel: () => void;
}

// ============================================================
// CONSTANTES
// ============================================================
const TIPO_STYLE = {
    SALVA: {
        border: '3px solid #ff4444',
        badge_bg: '#330000',
        badge_color: '#ff4444',
        badge_border: '#550000',
    },
    REGLAJE: {
        border: '3px solid #00bcd4',
        badge_bg: '#002233',
        badge_color: '#00bcd4',
        badge_border: '#004455',
    },
} as const;

// ============================================================
// HELPERS
// ============================================================

/**
 * El primer tiro (SALVA inicial) no puede eliminarse:
 * es la base de la misión y su borrado rompería las correcciones acumuladas.
 */
function isPrimerTiro(logs: LogTiro[], log: LogTiro): boolean {
    if (log.tipo !== 'SALVA') return false;
    const salvas = logs.filter(l => l.tipo === 'SALVA');
    return salvas.length > 0 && salvas[salvas.length - 1].id === log.id;
}

// ============================================================
// SUB-COMPONENTES
// ============================================================

const DataBox = memo(({ label, value, suffix = '', color }: DataBoxProps) => (
    <div style={{ background: '#111', border: '1px solid #333', padding: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.55rem', color: '#666', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color }}>
            {value}<span style={{ fontSize: '0.6rem', color: '#444' }}>{suffix}</span>
        </div>
    </div>
));
DataBox.displayName = 'DataBox';

const IconEdit = memo(() => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
));
IconEdit.displayName = 'IconEdit';

const IconDelete = memo(() => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
));
IconDelete.displayName = 'IconDelete';

// ============================================================
// MODAL CONFIRMACIÓN ELIMINAR
// ============================================================
function ConfirmDeleteModal({ log, onConfirm, onCancel }: ConfirmDeleteModalProps) {
    const esSalva = log.tipo === 'SALVA';
    const accentColor = esSalva ? '#ff4444' : '#00bcd4';
    const bgAccent = esSalva ? 'rgba(255,68,68,0.08)' : 'rgba(0,188,212,0.08)';
    const borderAccent = esSalva ? '#661111' : '#004455';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace',
        }}>
            <div style={{
                background: '#060d0f',
                border: `2px solid ${accentColor}`,
                boxShadow: `0 0 30px ${accentColor}44, inset 0 0 20px ${accentColor}08`,
                padding: '28px 36px',
                maxWidth: '400px', width: '90%',
                textAlign: 'center',
            }}>
                {/* Header */}
                <div style={{ borderBottom: `1px solid ${accentColor}`, paddingBottom: '10px', marginBottom: '18px' }}>
                    <div style={{ color: accentColor, fontSize: '0.6rem', letterSpacing: '3px', marginBottom: '5px' }}>
                        ⚠ CONFIRMAR OPERACIÓN ⚠
                    </div>
                    <div style={{ color: accentColor, fontSize: '1rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                        ELIMINAR REGISTRO #{log.id}
                    </div>
                </div>

                {/* Info del registro */}
                <div style={{
                    background: bgAccent, border: `1px solid ${borderAccent}`,
                    padding: '10px 14px', marginBottom: '18px',
                    textAlign: 'left', fontSize: '0.68rem', color: '#aaa', lineHeight: '1.8',
                }}>
                    <div>▸ Tipo: <span style={{ color: accentColor }}>{log.tipo}</span></div>
                    <div>▸ Hora: <span style={{ color: '#fff' }}>{log.hora}</span></div>
                    <div style={{ color: '#666', fontSize: '0.62rem', marginTop: '4px', fontStyle: 'italic' }}>
                        {log.detalle}
                    </div>
                </div>

                {log.tipo === 'REGLAJE' && (
                    <div style={{ color: '#ffcc00', fontSize: '0.65rem', marginBottom: '18px', letterSpacing: '1px' }}>
                        Las correcciones acumuladas serán recalculadas.
                    </div>
                )}

                {/* Botones */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '9px', fontFamily: 'monospace', fontWeight: 'bold',
                            fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '1px',
                            background: '#060d0f', color: '#00e5ff', border: '1px solid #00e5ff',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#060d0f')}
                    >
                        [ CANCELAR ]
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '9px', fontFamily: 'monospace', fontWeight: 'bold',
                            fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '1px',
                            background: '#1a0000', color: accentColor, border: `2px solid ${accentColor}`,
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${accentColor}22`)}
                        onMouseLeave={e => (e.currentTarget.style.background = '#1a0000')}
                    >
                        [ ELIMINAR ]
                    </button>
                </div>

                <div style={{ marginTop: '14px', color: '#333', fontSize: '0.58rem', letterSpacing: '2px' }}>
                    MORTEROS-MARIA // SEC-CLEARANCE-1
                </div>
            </div>
        </div>
    );
}

// ============================================================
// LOG ITEM (extraído para claridad y re-renders controlados)
// ============================================================
interface LogItemProps {
    log: LogTiro;
    isExpanded: boolean;
    esPrimero: boolean;
    onToggle: (id: number) => void;
    onEditRequest: (log: LogTiro) => void;
    onDeleteRequest: (log: LogTiro) => void;
    isLatest: boolean;
}

const LogItem = memo(({
    log, isExpanded, esPrimero, onToggle,
    onEditRequest, onDeleteRequest, isLatest,
}: LogItemProps) => {
    const results = log.fullData?.results;
    const inputs = log.fullData?.inputs;
    const tipoStyle = TIPO_STYLE[log.tipo];

    const viewDeriva = results?.cmd_deriva ?? '----';
    const viewElev = results?.cmd_elev ?? '----';
    const viewCharge = inputs?.carga_seleccionada === '-'
        ? results?.carga_rec
        : inputs?.carga_seleccionada;

    return (
        <div style={{
            borderBottom: '1px solid #222',
            background: isExpanded ? '#111' : (isLatest ? 'rgba(0,50,0,0.2)' : 'transparent'),
            transition: 'background 0.2s',
        }}>
            {/* Fila resumen */}
            <div
                onClick={() => onToggle(log.id)}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '35px 1fr 70px',
                    alignItems: 'center',
                    minHeight: '45px',
                    cursor: 'pointer',
                    borderLeft: tipoStyle.border,
                }}
            >
                {/* ID */}
                <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', fontWeight: 'bold' }}>
                    #{log.id}
                </div>

                {/* Info central */}
                <div style={{ padding: '4px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                            fontSize: '0.6rem', padding: '1px 4px', borderRadius: '2px',
                            background: tipoStyle.badge_bg,
                            color: tipoStyle.badge_color,
                            border: `1px solid ${tipoStyle.badge_border}`,
                        }}>
                            {log.tipo}
                        </span>
                        <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            DER {viewDeriva} <span style={{ color: '#444' }}>|</span> ALZ {viewElev}
                        </span>
                    </div>
                    <div style={{
                        fontSize: '0.6rem', color: '#888',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {log.detalle}
                    </div>
                </div>

                {/* Controles */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                    {log.tipo === 'REGLAJE' && (
                        <button
                            onClick={e => { e.stopPropagation(); onEditRequest(log); }}
                            title="Editar Reglaje"
                            style={{
                                background: '#111', border: '1px solid #333', color: '#ffb300',
                                width: '26px', height: '26px', borderRadius: '2px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <IconEdit />
                        </button>
                    )}

                    <button
                        onClick={e => { e.stopPropagation(); if (!esPrimero) onDeleteRequest(log); }}
                        title={esPrimero ? 'El primer tiro no puede eliminarse' : 'Eliminar registro'}
                        disabled={esPrimero}
                        style={{
                            background: '#111',
                            border: `1px solid ${esPrimero ? '#222' : '#333'}`,
                            color: esPrimero ? '#333' : '#ff4444',
                            width: '26px', height: '26px', borderRadius: '2px',
                            cursor: esPrimero ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: esPrimero ? 0.4 : 1,
                        }}
                    >
                        <IconDelete />
                    </button>
                </div>
            </div>

            {/* Panel expandible */}
            {isExpanded && log.fullData && results && inputs && (
                <div style={{
                    background: '#050505', borderTop: '1px solid #222',
                    borderBottom: '1px solid #333', padding: '10px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                        <DataBox label="DERIVA" value={viewDeriva} color="#ffb300" />
                        <DataBox label="ELEVACIÓN" value={viewElev} color="#ffb300" />
                        <DataBox label="CARGA" value={viewCharge ?? 'N/A'} color="#fff" />
                        <DataBox label="TIEMPO" value={results.cmd_time} color="#fff" suffix="s" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ border: '1px solid #222', padding: '5px' }}>
                            <div style={{ fontSize: '0.6rem', color: '#00bcd4', marginBottom: '4px', borderBottom: '1px solid #222' }}>
                                DATOS BLANCO
                            </div>
                            {([
                                ['DIST', `${Math.round(results.distancia)} m`],
                                ['AZ MAG', `${Math.round(results.azimutMag)}`],
                                ['AZ GRID', `${Math.round(results.azimutMils)}`],
                            ] as [string, string][]).map(([k, v]) => (
                                <div key={k} style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{k}:</span>
                                    <span style={{ color: '#fff' }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ border: '1px solid #222', padding: '5px' }}>
                            <div style={{ fontSize: '0.6rem', color: '#4dff88', marginBottom: '4px', borderBottom: '1px solid #222' }}>
                                METEO / POS
                            </div>
                            {([
                                ['VIENTO', `${inputs.meteo_dir}@${inputs.meteo_vel}`],
                                ['TEMP', `${inputs.meteo_temp}°C`],
                                ['COORD', `${inputs.tx}/${inputs.ty}`],
                            ] as [string, string][]).map(([k, v]) => (
                                <div key={k} style={{ fontSize: '0.65rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{k}:</span>
                                    <span style={{ color: k === 'COORD' ? '#888' : '#fff' }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        fontSize: '0.65rem', color: '#666', background: '#000',
                        padding: '4px', border: '1px dashed #333', fontStyle: 'italic',
                    }}>
                        LOG: {log.detalle} | T: {log.hora}
                    </div>
                </div>
            )}
        </div>
    );
});
LogItem.displayName = 'LogItem';

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const MissionLog = memo(function MissionLog({ logs, onDelete, onEdit }: MissionLogProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    // logAConfirmar: guarda qué log está pendiente de confirmar eliminación.
    // Se limpia al confirmar o cancelar — nunca se llama window.confirm.
    const [logAConfirmar, setLogAConfirmar] = useState<LogTiro | null>(null);

    const toggleDetails = useCallback((id: number) =>
        setExpandedId(prev => prev === id ? null : id),
        []);

    // Abre el modal nativo (no window.confirm)
    const handleDeleteRequest = useCallback((log: LogTiro) => {
        setLogAConfirmar(log);
    }, []);

    // Confirma la eliminación y cierra el modal
    const handleDeleteConfirm = useCallback(() => {
        if (logAConfirmar) onDelete(logAConfirmar.id);
        setLogAConfirmar(null);
    }, [logAConfirmar, onDelete]);

    const handleDeleteCancel = useCallback(() => {
        setLogAConfirmar(null);
    }, []);

    return (
        <>
            {/* Modal de confirmación — renderizado en portal lógico encima de todo */}
            {logAConfirmar && (
                <ConfirmDeleteModal
                    log={logAConfirmar}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                />
            )}

            <div
                className="sidebar-section flexible-height"
                style={{
                    display: 'flex', flexDirection: 'column',
                    minHeight: '180px', border: '1px solid #333',
                    background: '#080808', fontFamily: 'Consolas, monospace',
                }}
            >
                {/* Cabecera */}
                <div style={{
                    background: 'linear-gradient(90deg, #1a1a1a 0%, #000 100%)',
                    borderBottom: '1px solid #ffb300',
                    padding: '6px 10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '8px', height: '8px', background: '#ffb300',
                            borderRadius: '50%', boxShadow: '0 0 5px #ffb300',
                        }} />
                        <label style={{
                            margin: 0, color: '#ffb300', fontSize: '0.75rem',
                            fontWeight: 'bold', letterSpacing: '1px',
                        }}>
                            BITÁCORA DE TIRO
                        </label>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#666', border: '1px solid #333', padding: '0 4px' }}>
                        REG: {logs.length.toString().padStart(2, '0')}
                    </span>
                </div>

                {/* Lista */}
                <div
                    className="history-list-styled"
                    style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                    {logs.length === 0 ? (
                        <div style={{
                            padding: '40px', textAlign: 'center',
                            color: '#333', fontSize: '0.7rem', letterSpacing: '1px',
                        }}>
                            [ SIN REGISTROS DE TIRO ]
                        </div>
                    ) : (
                        logs.map((log, index) => (
                            <LogItem
                                key={log.id}
                                log={log}
                                isExpanded={expandedId === log.id}
                                esPrimero={isPrimerTiro(logs, log)}
                                isLatest={index === 0}
                                onToggle={toggleDetails}
                                onEditRequest={onEdit}
                                onDeleteRequest={handleDeleteRequest}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
});