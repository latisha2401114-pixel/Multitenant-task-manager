import { fetchApi } from './api';

export const getWorkloadInsights = async () => {
  return await fetchApi('/insights/workload');
};
