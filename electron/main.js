const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 850,
    title: "MORTEROS-MARIA // SISTEMA DE TIRO",
    backgroundColor: '#000000', // Fondo negro para que no parpadee en blanco
    icon: path.join(__dirname, '../public/icon.ico'), // (Opcional si tienes icono)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true, // Oculta la barra de menú (Archivo, Editar...)
  });

  // EN DESARROLLO: Carga la URL de Vite
  // EN PRODUCCIÓN: Carga el archivo HTML generado
  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Descomenta si quieres ver la consola de errores
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});