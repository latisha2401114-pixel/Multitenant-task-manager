const { z } = require('zod');

const createWorkflowSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Workflow name is required"),
    description: z.string().optional(),
    stages: z.array(z.object({
      name: z.string().min(1, "Stage name is required"),
      orderIndex: z.number().int().min(0),
    })).min(1, "At least one stage is required"),
  }),
});

module.exports = {
  createWorkflowSchema,
};
