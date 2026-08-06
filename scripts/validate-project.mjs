import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectDir = process.cwd();

for (const relativePath of [
  'main.js',
  'src/openapi.js',
  'src/services/Assistant.js',
  'src/services/Server.js',
  'scripts/smoke-test.mjs',
  'Dockerfile',
]) {
  await access(resolve(projectDir, relativePath));
}

console.log(`Validated project structure in ${projectDir}`);
