// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
// const preloadPath = isDev
//   ? path.join(__dirname, 'preload.cjs')
//   : path.join(__dirname, 'dist', 'preload.cjs');


// global.shared = {
//     assetPath: isDev
//         ? path.join(__dirname, 'assets')
//         : path.join(process.resourcesPath, 'assets'),
// };

function createWindow() {
    const win = new BrowserWindow({
        width: 320,
        height: 180,
        // autoHideMenuBar: true,
        // fullscreen: true,
        webPreferences: {
            // preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            enableWebSQL: false,
            webgl: true,
            offscreen: false,
            sandbox: false
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    win.once('ready-to-show', () => {
        win.show();
        win.focus();
      });
}

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer,CanvasOopRasterization,WebAssemblySimd');
// app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
