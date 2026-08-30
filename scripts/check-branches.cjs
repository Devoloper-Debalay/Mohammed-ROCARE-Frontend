const { PrismaClient } = require('../../ROCARE_backend/src/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('Found branches:', branches.length);
  console.log(JSON.stringify(branches, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
