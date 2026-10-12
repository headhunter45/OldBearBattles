import net from 'node:net';
import concurrently from 'concurrently';

function testBind(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function isPortFree(port) {
  const [v4Wildcard, v4Loopback] = await Promise.all([
    testBind(port, '0.0.0.0'),
    testBind(port, '127.0.0.1'),
  ]);
  return v4Wildcard && v4Loopback;
}

async function findAvailablePort(startPort, exclude = new Set()) {
  let port = startPort;
  while (port < 65535) {
    if (!exclude.has(port) && (await isPortFree(port))) {
      return port;
    }
    port++;
  }
  throw new Error(`No available ports found starting from ${startPort}`);
}

async function main() {
  const basePort = parseInt(process.env.PORT_START || process.env.START_PORT || '3000', 10);

  console.log(`[Dev Launcher] Searching for available ports starting at ${basePort}...`);

  const clientPort = process.env.CLIENT_PORT
    ? parseInt(process.env.CLIENT_PORT, 10)
    : await findAvailablePort(basePort);

  const excludeForServer = new Set([clientPort]);
  const serverPort = process.env.SERVER_PORT
    ? parseInt(process.env.SERVER_PORT, 10)
    : await findAvailablePort(basePort, excludeForServer);

  console.log(`[Dev Launcher] Assigned Client port: ${clientPort}`);
  console.log(`[Dev Launcher] Assigned Server port: ${serverPort}`);
  console.log(`[Dev Launcher] Starting backend and frontend...\n`);

  const envOverrides = {
    ...process.env,
    PORT: String(serverPort),
    SERVER_PORT: String(serverPort),
    CLIENT_PORT: String(clientPort),
  };

  const { result } = concurrently(
    [
      {
        command: 'yarn workspace @oldbear/server dev',
        name: 'SERVER',
        prefixColor: 'cyan',
        env: envOverrides,
      },
      {
        command: 'yarn workspace @oldbear/client dev',
        name: 'CLIENT',
        prefixColor: 'magenta',
        env: envOverrides,
      },
    ],
    {
      killOthersOn: ['failure'],
      prefix: '[{name}]',
    }
  );

  try {
    await result;
  } catch {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Dev Launcher] Error starting dev environment:', err);
  process.exit(1);
});
