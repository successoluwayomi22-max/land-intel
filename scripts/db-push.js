process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = 'binary';
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
const { execSync } = require('child_process');

console.log('Pushing schema to database with binary engine...');
execSync('npx prisma db push', { stdio: 'inherit' });
