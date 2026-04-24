const { getTenantDb } = require('../db/prisma');

const getWorkloadInsights = async (tenantId, userId) => {
  const db = getTenantDb(tenantId);
  
  // Get active tasks for the user
  const tasks = await db.task.findMany({
    where: {
      tenantId,
      assignedToId: userId,
      isDeleted: false,
      status: { not: 'COMPLETED' }
    }
  });

  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const upcomingDeadlines = tasks.filter(t => t.deadline && new Date(t.deadline) <= next48Hours && new Date(t.deadline) >= now);
  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < now);
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
  
  // Identify unique risky tasks
  const riskyTasks = [...new Set([...upcomingDeadlines, ...overdueTasks, ...blockedTasks])];

  const totalActiveTasks = tasks.length;
  
  // Calculate overloaded status
  let overloaded = false;
  if (totalActiveTasks > 10 || upcomingDeadlines.length > 3 || overdueTasks.length > 0) {
    overloaded = true;
  }

  // Generate simple suggestion
  let suggestion = "You have a manageable workload. Keep it up!";
  if (overloaded) {
    suggestion = "Your workload is currently high. Consider delegating tasks or pushing back non-critical deadlines.";
  } else if (blockedTasks.length > 0) {
    suggestion = "You have blocked tasks. Focus on reaching out to your team to unblock your pipeline.";
  } else if (upcomingDeadlines.length > 0) {
    suggestion = "Focus your attention on tasks with deadlines approaching in the next 48 hours.";
  }

  return {
    overloaded,
    metrics: {
      totalActiveTasks,
      upcomingDeadlinesCount: upcomingDeadlines.length,
      overdueCount: overdueTasks.length,
      blockedCount: blockedTasks.length,
    },
    riskyTasks: riskyTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      deadline: t.deadline
    })),
    suggestion
  };
};

module.exports = {
  getWorkloadInsights
};
