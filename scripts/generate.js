process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = 'binary';
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
const { execSync } = require('child_process');

console.log('Generating Prisma Client with binary engine...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma Client generated successfully!');
} catch (err) {
  console.error('Prisma generate encountered an issue:', err.message);
}
