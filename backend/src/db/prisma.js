const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances of Prisma Client in development
const basePrisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = basePrisma;
}

// Pattern/helper to enforce strict tenant isolation
const getTenantDb = (tenantId) => {
  if (!tenantId) {
    throw new Error('FATAL: tenantId is required for tenant-scoped database operations.');
  }

  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // We apply isolation to all models except the Tenant model itself
          if (model !== 'Tenant') {
            // Ensure where clause has tenantId only for operations that support it
            const operationsWithWhere = ['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'];
            if (operationsWithWhere.includes(operation)) {
              args.where = { ...args.where, tenantId };
            }

            // For create operations, automatically inject tenantId
            if (operation === 'create' || operation === 'createMany') {
              if (args.data) {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map(d => ({ ...d, tenantId }));
                } else {
                  args.data.tenantId = tenantId;
                }
              }
            }
          }
          return query(args);
        },
      },
    },
  });
};

module.exports = {
  prisma: basePrisma,
  getTenantDb,
};
