const { getTenantDb } = require('../db/prisma');
const { getIo } = require('../socket');

// Helper to calculate status based on dependencies
const evaluateTaskStatus = async (db, tenantId, taskId, currentStatus) => {
  if (currentStatus === 'COMPLETED') return 'COMPLETED'; // Stay completed

  const deps = await db.taskDependency.findMany({
    where: { dependentId: taskId, tenantId },
    include: { dependencyTask: true }
  });

  const hasIncompleteDeps = deps.some(d => d.dependencyTask.status !== 'COMPLETED' && !d.dependencyTask.isDeleted);
  
  if (hasIncompleteDeps) {
    return 'BLOCKED';
  } else if (currentStatus === 'BLOCKED') {
    return 'OPEN'; // Unblocked
  }

  return currentStatus || 'OPEN';
};

// Check for circular dependencies using DFS
const checkCircularDependency = async (db, tenantId, startTaskId, newDependencyIds) => {
  if (!newDependencyIds || newDependencyIds.length === 0) return false;

  const queue = [...newDependencyIds];
  const visited = new Set();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === startTaskId) {
      return true; // Circular dependency found!
    }

    if (!visited.has(currentId)) {
      visited.add(currentId);
      
      const currentDeps = await db.taskDependency.findMany({
        where: { dependentId: currentId, tenantId },
        select: { dependencyId: true }
      });

      for (const dep of currentDeps) {
        queue.push(dep.dependencyId);
      }
    }
  }

  return false;
};

// Recursive unblocking
const recursivelyEvaluateDependents = async (db, tenantId, taskId, visited = new Set()) => {
  if (visited.has(taskId)) return; // Avoid infinite loops
  visited.add(taskId);

  const dependents = await db.taskDependency.findMany({
    where: { dependencyId: taskId, tenantId }
  });

  for (const dep of dependents) {
    const dependentTask = await db.task.findUnique({ where: { id: dep.dependentId } });
    if (!dependentTask || dependentTask.isDeleted) continue;

    const depStatus = await evaluateTaskStatus(db, tenantId, dep.dependentId, 'OPEN'); // Assume unblocked to check
    if (depStatus !== dependentTask.status && dependentTask.status !== 'COMPLETED') {
      await db.task.update({
        where: { id: dep.dependentId },
        data: { status: depStatus }
      });
      try {
        getIo().to(tenantId).emit('task_updated', { id: dep.dependentId, status: depStatus });
      } catch (e) {}
      // If we just unblocked it and it was completed (unlikely), recurse
      if (depStatus === 'COMPLETED') {
         await recursivelyEvaluateDependents(db, tenantId, dep.dependentId, visited);
      }
    }
  }
};

const createTask = async (tenantId, data) => {
  const db = getTenantDb(tenantId);
  const { dependencyTaskIds, ...taskData } = data;

  if (taskData.workflowStageId) {
    const stage = await db.workflowStage.findUnique({ where: { id: taskData.workflowStageId } });
    if (!stage) throw new Error('Workflow stage not found');
  }

  let status = 'OPEN';
  if (dependencyTaskIds && dependencyTaskIds.length > 0) {
    const deps = await db.task.findMany({ 
      where: { id: { in: dependencyTaskIds }, tenantId, isDeleted: false } 
    });
    if (deps.some(d => d.status !== 'COMPLETED')) {
      status = 'BLOCKED';
    }
  }

  const task = await db.task.create({
    data: {
      ...taskData,
      status,
      tenantId,
      dependencies: {
        create: (dependencyTaskIds || []).map(id => ({
          dependencyId: id,
          tenantId,
        })),
      }
    },
    include: { dependencies: true }
  });

  try {
    getIo().to(tenantId).emit('task_created', task);
  } catch (e) {}

  return task;
};

const getTasks = async (tenantId, filters = {}) => {
  const db = getTenantDb(tenantId);
  
  const where = { isDeleted: false };
  if (filters.workflowStageId) where.workflowStageId = filters.workflowStageId;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.status) where.status = filters.status;

  return await db.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      workflowStage: true,
      dependencies: { include: { dependencyTask: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getTaskById = async (tenantId, taskId) => {
  const db = getTenantDb(tenantId);
  const task = await db.task.findFirst({
    where: { id: taskId, isDeleted: false },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      workflowStage: true,
      dependencies: { include: { dependencyTask: true } },
      dependents: { include: { dependentTask: true } },
    },
  });

  if (!task) throw new Error('Task not found');
  return task;
};

const updateTask = async (tenantId, taskId, updateData) => {
  const db = getTenantDb(tenantId);
  const { dependencyTaskIds, version, ...data } = updateData;

  const existingTask = await getTaskById(tenantId, taskId);

  if (data.workflowStageId && existingTask.workflowStageId !== data.workflowStageId) {
    const oldStage = await db.workflowStage.findUnique({ where: { id: existingTask.workflowStageId } });
    const newStage = await db.workflowStage.findUnique({ where: { id: data.workflowStageId } });
    
    if (oldStage && newStage && oldStage.workflowId !== newStage.workflowId) {
      throw new Error('Cannot move task to a different workflow');
    }
  }

  if (dependencyTaskIds !== undefined) {
    const isCircular = await checkCircularDependency(db, tenantId, taskId, dependencyTaskIds);
    if (isCircular) {
      throw new Error('Circular dependency detected. Cannot add these dependencies.');
    }

    await db.taskDependency.deleteMany({ where: { dependentId: taskId, tenantId } });
    if (dependencyTaskIds.length > 0) {
      await db.taskDependency.createMany({
        data: dependencyTaskIds.map(depId => ({
          tenantId,
          dependentId: taskId,
          dependencyId: depId
        }))
      });
    }
  }

  let finalStatus = data.status || existingTask.status;
  finalStatus = await evaluateTaskStatus(db, tenantId, taskId, finalStatus);
  data.status = finalStatus;

  try {
    const updatedTask = await db.task.update({
      where: { 
        id: taskId,
        version: version 
      },
      data: {
        ...data,
        version: { increment: 1 }
      },
      include: {
        dependencies: { include: { dependencyTask: true } }
      }
    });

    if (finalStatus === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      await recursivelyEvaluateDependents(db, tenantId, taskId, new Set());
    }

    try {
      getIo().to(tenantId).emit('task_updated', updatedTask);
    } catch (e) {}

    return updatedTask;
  } catch (error) {
    if (error.code === 'P2025') {
      const e = new Error('Concurrency Error: Task was modified by another request. Please refresh and try again.');
      e.statusCode = 409;
      throw e;
    }
    throw error;
  }
};

const deleteTask = async (tenantId, taskId) => {
  const db = getTenantDb(tenantId);
  await getTaskById(tenantId, taskId);
  
  // Soft delete
  return await db.task.update({ 
    where: { id: taskId },
    data: { isDeleted: true }
  });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
