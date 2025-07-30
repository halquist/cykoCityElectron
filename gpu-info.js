// gpu-info.js
const { app } = require('electron');

app.whenReady().then(async () => {
  const info = await app.getGPUInfo('complete');
  console.log('--- GPU Info ---');
  console.log(JSON.stringify(info, null, 2));
  app.quit();
});
