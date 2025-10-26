/**
 * Fix for Next.js SWC code signature error on macOS
 *
 * This script removes the quarantine attribute from the native SWC binary
 * which can cause "code signature invalid" errors on macOS.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function fixSwcBinary() {
  // Only run on macOS
  if (process.platform !== 'darwin') {
    console.log('Not running on macOS, skipping SWC fix');
    return;
  }

  const swcPath = path.join(
    __dirname,
    'node_modules',
    '@next',
    'swc-darwin-arm64',
    'next-swc.darwin-arm64.node'
  );

  // Check if the binary exists
  if (!fs.existsSync(swcPath)) {
    console.log('SWC binary not found, it may be installed later');
    return;
  }

  try {
    console.log('Removing quarantine attribute from SWC binary...');
    execSync(`xattr -d com.apple.quarantine "${swcPath}"`, {
      stdio: 'inherit'
    });
    console.log('Successfully fixed SWC binary!');
  } catch (error) {
    // Attribute might not exist, which is fine
    if (error.message.includes('No such xattr')) {
      console.log('SWC binary is already clean');
    } else {
      console.warn('Warning: Could not remove quarantine attribute:', error.message);
    }
  }
}

// Run the fix
try {
  fixSwcBinary();
} catch (error) {
  console.warn('Warning: SWC fix script encountered an error:', error.message);
  // Don't fail the installation
  process.exit(0);
}
