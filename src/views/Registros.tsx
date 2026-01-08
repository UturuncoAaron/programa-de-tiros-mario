import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export function Registros() {
    const [historial, setHistorial] = useState<any[]>([]);

    // Al entrar, leemos la memoria
    useEffect(() => {
        const data = localStorage.getItem('mision_logs');
        if (data) setHistorial(JSON.parse(data));
    }, []);

    const descargarExcel = () => {
        if (historial.length === 0) { alert("No hay registros."); return; }

        // Crear Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(historial);

        // Ancho de columnas
        ws['!cols'] = [{ wch: 5 }, { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(wb, ws, "Mision_Log");
        XLSX.writeFile(wb, `MISION_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const borrarTodo = () => {
        if (confirm("¿Seguro de borrar todo el historial?")) {
            localStorage.removeItem('mision_logs');
            setHistorial([]);
        }
    }

    return (
        <div style={{ padding: '20px', color: '#fff', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Rajdhani', color: '#4dff88' }}>REGISTROS DE MISIÓN</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={borrarTodo} style={{ background: '#330000', color: '#ff4444', border: '1px solid #ff4444', padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                        BORRAR TODO
                    </button>
                    <button onClick={descargarExcel} style={{ background: '#003300', color: '#4dff88', border: '1px solid #4dff88', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📥 DESCARGAR EXCEL
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #333', background: '#000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#111' }}>
                        <tr style={{ color: '#aaa', borderBottom: '2px solid #444' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>HORA</th>
                            <th style={{ padding: '12px' }}>TIPO</th>
                            <th style={{ padding: '12px' }}>DETALLE</th>
                            <th style={{ padding: '12px' }}>COORDENADAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historial.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#555' }}>SIN REGISTROS DISPONIBLES</td></tr>
                        ) : (
                            historial.map((log, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #222', background: idx % 2 === 0 ? '#050505' : '#0a0a0a' }}>
                                    <td style={{ padding: '10px', color: '#ffb300' }}>#{log.id}</td>
                                    <td style={{ padding: '10px' }}>{log.hora}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{
                                            background: log.tipo === 'REGLAJE' ? 'rgba(255, 68, 68, 0.2)' : 'rgba(77, 255, 136, 0.2)',
                                            color: log.tipo === 'REGLAJE' ? '#ff4444' : '#4dff88',
                                            padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold'
                                        }}>
                                            {log.tipo}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', color: '#ccc' }}>{log.detalle}</td>
                                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#aaa' }}>{log.coords}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}