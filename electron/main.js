const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const APP_PORT = process.env.APP_PORT || '4503';
const APP_HOST = '127.0.0.1';
let backendProcess = null;

function getProjectPath(...segments) {
  return path.join(__dirname, '..', ...segments);
}

function runNodeProcess(scriptPath, args = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      env: {
        ...process.env,
        ...extraEnv,
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Process failed with exit code ${code}`));
    });
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error('Timed out waiting for the local server.'));
          return;
        }

        setTimeout(check, 500);
      });
    };

    check();
  });
}

async function prepareDatabase() {
  const schemaPath = getProjectPath('backend', 'prisma', 'schema.prisma');
  const prismaCliPath = getProjectPath('backend', 'node_modules', 'prisma', 'build', 'index.js');
  const migrationFilePath = getProjectPath('backend', 'prisma', 'migrations', '20260416201807_init', 'migration.sql');
  const seedPath = getProjectPath('backend', 'prisma', 'seed.js');
  const databaseUrl = `file:${path.join(app.getPath('userData'), 'hall-booking.db')}`;
  const prismaEnv = {
    DATABASE_URL: databaseUrl,
  };

  await runNodeProcess(prismaCliPath, ['db', 'execute', '--schema', schemaPath, '--file', migrationFilePath], prismaEnv);
  await runNodeProcess(seedPath, [], prismaEnv);

  return prismaEnv;
}

async function startBackend(extraEnv) {
  const serverPath = getProjectPath('backend', 'server.js');

  backendProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ...extraEnv,
      PORT: APP_PORT,
      HOST: APP_HOST,
      CLIENT_URL: `http://${APP_HOST}:${APP_PORT}`,
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'inherit',
  });

  backendProcess.once('exit', (code) => {
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox('Backend Error', `The local backend stopped unexpectedly with code ${code}.`);
      app.quit();
    }
  });

  await waitForServer(`http://${APP_HOST}:${APP_PORT}/health`);
}

async function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await window.loadURL(`http://${APP_HOST}:${APP_PORT}`);
}

async function bootApplication() {
  try {
    const prismaEnv = await prepareDatabase();
    await startBackend(prismaEnv);
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox('Startup Error', error.message);
    app.quit();
  }
}

app.whenReady().then(bootApplication);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;

  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
