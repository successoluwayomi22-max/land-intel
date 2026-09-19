process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = 'binary';
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
const { execSync } = require('child_process');

console.log('Generating Prisma Client (if needed)...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.log('Notice: Prisma generate skipped or query engine locked by running server.');
}

console.log('Building Next.js application...');
execSync('npx next build', { stdio: 'inherit' });
