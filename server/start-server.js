// Script de démarrage du serveur avec gestion d'erreurs
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Admin API Backend Server...');
console.log('📁 Working directory:', __dirname);

const serverProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

serverProcess.on('error', (error) => {
    console.error('❌ Error starting server:', error);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
    }
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill();
    process.exit(0);
});


