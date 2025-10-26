/**
 * Fix for Next.js SWC code signature error on macOS
 *
 * This script fixes code signature issues with the native SWC binary on macOS by:
 * 1. Removing quarantine attributes
 * 2. Clearing all extended attributes
 * 3. Re-signing with an ad-hoc signature
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

  console.log('Fixing SWC binary code signature issues...');

  // Step 1: Remove quarantine attribute
  try {
    execSync(`xattr -d com.apple.quarantine "${swcPath}" 2>/dev/null`, {
      stdio: 'pipe'
    });
    console.log('✓ Removed quarantine attribute');
  } catch (error) {
    // Attribute might not exist, which is fine
    console.log('  Quarantine attribute not present (OK)');
  }

  // Step 2: Clear all extended attributes
  try {
    execSync(`xattr -c "${swcPath}"`, {
      stdio: 'pipe'
    });
    console.log('✓ Cleared all extended attributes');
  } catch (error) {
    console.log('  No extended attributes to clear (OK)');
  }

  // Step 3: Re-sign with ad-hoc signature
  try {
    execSync(`codesign --force --deep --sign - "${swcPath}"`, {
      stdio: 'pipe'
    });
    console.log('✓ Re-signed binary with ad-hoc signature');
    console.log('Successfully fixed SWC binary!');
  } catch (error) {
    console.warn('⚠ Could not re-sign binary:', error.message);
    console.warn('  The dev server will fall back to WASM bindings (slower but functional)');
  }
}

// Run the fix
try {
  fixSwcBinary();
} catch (error) {
  console.warn('Warning: SWC fix script encountered an error:', error.message);
  console.warn('  The dev server will fall back to WASM bindings');
  // Don't fail the installation
  process.exit(0);
}
