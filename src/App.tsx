import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Calculadora } from './views/Calculadora';
import { Registros } from './views/Registros';
import './index.css';
import { Tablas } from './views/Tablas';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
        
        <Sidebar />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Calculadora />} />
            <Route path="/registros" element={<Registros />} />
            <Route path="/tablas" element={<Tablas />} />
            <Route path="/info" element={<div style={{padding:20, color:'white'}}>SISTEMA MORTEROS-MARIA v1.0</div>} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;