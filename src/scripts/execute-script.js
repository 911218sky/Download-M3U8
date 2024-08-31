const { execSync } = require('child_process');

const scriptArgIndex = process.argv.indexOf('--script');

if (scriptArgIndex === -1 || scriptArgIndex === process.argv.length - 1) {
  console.log(scriptArgIndex);
  console.error('Usage: ts-node execute-script.ts --script <script-name>');
  process.exit(1);
}

const scriptName = process.argv[scriptArgIndex + 1];
const scriptPath = `./src/scripts/download-manager/${scriptName}`;

try {
  execSync(`ts-node ${scriptPath}`, { stdio: 'inherit' });
  console.log('Script is done.');
} catch (error) {
  console.error('Script execution failed.');
  process.exit(1);
}