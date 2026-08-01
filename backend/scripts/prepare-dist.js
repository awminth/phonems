const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..');
const frontendRoot = path.join(backendRoot, '..', 'frontend');
const distDir = path.join(backendRoot, 'dist');

function run(command, cwd) {
  console.log(`\n> ${command}`);
  execSync(command, { cwd, stdio: 'inherit', env: process.env });
}

if (!fs.existsSync(frontendRoot)) {
  console.error('Frontend folder not found at', frontendRoot);
  process.exit(1);
}

console.log('Installing frontend dependencies (including vite)...');
run('npm install --include=dev', frontendRoot);

console.log('Building frontend...');
run('npm run build', frontendRoot);

const frontendDist = path.join(frontendRoot, 'dist');
if (!fs.existsSync(frontendDist)) {
  console.error('Frontend build output missing:', frontendDist);
  process.exit(1);
}

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

fs.cpSync(frontendDist, distDir, { recursive: true });
console.log('\nCopied frontend/dist -> backend/dist');
console.log('SplitDeploy build complete.');
