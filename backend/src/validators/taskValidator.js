const { z } = require('zod');

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().nullable().optional(),
    workflowStageId: z.string().uuid("Invalid workflow stage ID").nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullable().optional(),
    deadline: z.string().datetime().nullable().optional(),
    assignedToId: z.string().uuid("Invalid user ID").nullable().optional(),
    dependencyTaskIds: z.array(z.string().uuid()).nullable().optional(),
  }).strict(),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).nullable().optional(),
    description: z.string().nullable().optional(),
    workflowStageId: z.string().uuid().nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullable().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']).nullable().optional(),
    deadline: z.string().datetime().nullable().optional(),
    assignedToId: z.string().uuid().nullable().optional(),
    dependencyTaskIds: z.array(z.string().uuid()).nullable().optional(),
    version: z.number().int().min(1, "Version is required for concurrency check"),
  }).strict(),
  params: z.object({
    id: z.string().uuid("Invalid task ID"),
  })
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
