import { loadEnvFileIfPresent } from './env.js';

loadEnvFileIfPresent('.env');
await import('./server.js');
