import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const isLocalTarget = !process.env.E2E_BASE_URL || new URL(process.env.E2E_BASE_URL).hostname === 'localhost';

if (!isLocalTarget) {
  console.log(`E2E_BASE_URL is remote (${process.env.E2E_BASE_URL}); skipping local content check.`);
} else if (!existsSync('content')) {
  console.log('No content/ clone; cloning the block library from da.live...');
  execSync('npx aem content clone --path /library --yes', { stdio: 'inherit' });
} else if (!existsSync('content/library/blocks')) {
  console.error('content/ exists but has no library/blocks. Run: npx aem content clone --all --force');
  process.exit(1);
}
