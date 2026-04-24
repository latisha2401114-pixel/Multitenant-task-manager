import { fetchApi } from './api';

export const getTaskSuggestions = async (title, description) => {
  return await fetchApi('/ai/suggest-tasks', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  });
};
