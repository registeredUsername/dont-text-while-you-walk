import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { qrcode } from 'vite-plugin-qrcode';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

function commitHash(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT__: JSON.stringify(commitHash()),
  },
  // Chemins relatifs : le build marche sur GitHub Pages (sous-dossier) et dans Capacitor.
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Expose le serveur sur le réseau local pour tester sur un vrai téléphone.
    host: true,
    port: 5173,
  },
  preview: { host: true, port: 4173 },
  // Affiche un QR code dans le terminal : scanne-le avec ton téléphone.
  plugins: [qrcode()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000, // Phaser pèse ~1,5 Mo, c'est normal.
  },
});
