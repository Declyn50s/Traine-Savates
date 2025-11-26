import { api } from '../services/api';
import { useApi } from './useApi';

export function useHomeData() {
  return useApi(() => api.getHomeData(), []);
}
