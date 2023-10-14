const { execSync } = require('child_process');

// Check if TypeScript is installed
try {
  execSync('tsc -v', { stdio: 'ignore' });
  console.log('TypeScript (tsc) is already installed.');
} catch (error) {
  console.log('TypeScript (tsc) is not installed. Attempting to install TypeScript.');

  // Install TypeScript globally using npm
  try {
    execSync('npm install -g typescript', { stdio: 'inherit' });
    console.log('TypeScript (tsc) installed successfully.');
  } catch (error) {
    console.error('TypeScript (tsc) installation failed. Please install TypeScript manually.');
    process.exit(1);
  }
}

// Execute the npm install command
console.log('Executing the npm install command...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('npm install command executed successfully.');
} catch (error) {
  console.error('npm install command failed.');
  process.exit(1);
}

// Execute other initialization steps
// You can add any other necessary initialization steps here
