// Mock AI Service
// To be replaced with actual @anthropic-ai/sdk call later

const suggestTasks = async (title, description) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let subtasks = [];
  let priority = 'MEDIUM';
  let suggestedDeadline = new Date();
  
  const content = (title + ' ' + (description || '')).toLowerCase();
  
  // Mock intelligence for priority and deadline
  if (content.includes('urgent') || content.includes('asap') || content.includes('critical')) {
    priority = 'URGENT';
    suggestedDeadline.setDate(suggestedDeadline.getDate() + 1); // 1 day
  } else if (content.includes('important')) {
    priority = 'HIGH';
    suggestedDeadline.setDate(suggestedDeadline.getDate() + 3); // 3 days
  } else if (content.includes('low') || content.includes('later')) {
    priority = 'LOW';
    suggestedDeadline.setDate(suggestedDeadline.getDate() + 14); // 2 weeks
  } else {
    suggestedDeadline.setDate(suggestedDeadline.getDate() + 7); // 1 week default
  }
  
  // Mock intelligence for subtasks
  if (content.includes('frontend') || content.includes('ui') || content.includes('design') || content.includes('react')) {
    subtasks = [
      'Create UI mockups',
      'Implement component structure',
      'Add styling and responsiveness',
      'Integrate with API endpoints'
    ];
  } else if (content.includes('backend') || content.includes('api') || content.includes('database')) {
    subtasks = [
      'Design database schema',
      'Implement API endpoints',
      'Write unit tests',
      'Update API documentation'
    ];
  } else if (content.includes('bug') || content.includes('fix') || content.includes('issue')) {
    subtasks = [
      'Reproduce the issue',
      'Identify root cause',
      'Implement fix',
      'Write regression test'
    ];
  } else {
    subtasks = [
      'Gather requirements',
      'Draft initial implementation',
      'Review and refine',
      'Finalize and deploy'
    ];
  }
  
  return {
    subtasks,
    priority,
    suggestedDeadline: suggestedDeadline.toISOString()
  };
};

module.exports = {
  suggestTasks
};
