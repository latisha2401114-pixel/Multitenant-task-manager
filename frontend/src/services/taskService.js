import { fetchApi } from './api';

export const getTasks = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `/tasks?${queryParams}` : '/tasks';
  return await fetchApi(endpoint);
};

export const updateTask = async (taskId, data) => {
  return await fetchApi(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const createTask = async (data) => {
  return await fetchApi(`/tasks`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
