const { getTenantDb } = require('../db/prisma');

const createWorkflow = async (tenantId, name, description, stages) => {
  const db = getTenantDb(tenantId);
  
  // Create workflow and its stages in a transaction
  return await db.workflow.create({
    data: {
      name,
      description,
      stages: {
        create: stages.map(stage => ({
          name: stage.name,
          orderIndex: stage.orderIndex,
          tenantId: tenantId, // manually provide for nested creates just in case the extension doesn't catch it
        })),
      },
    },
    include: {
      stages: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });
};

const getWorkflows = async (tenantId) => {
  const db = getTenantDb(tenantId);
  return await db.workflow.findMany({
    include: {
      stages: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });
};

module.exports = {
  createWorkflow,
  getWorkflows,
};
