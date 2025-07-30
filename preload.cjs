// preload.cjs
const path = require('path');
const { contextBridge } = require('electron');

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

contextBridge.exposeInMainWorld('shared', {
  assetPath: isDev
    ? path.join(__dirname, 'assets') + path.sep
    : path.join(process.resourcesPath, 'assets') + path.sep
});
