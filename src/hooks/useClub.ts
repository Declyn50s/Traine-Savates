import { api } from '../services/api';
import { useApi } from './useApi';

export function useClubData() {
  return useApi(() => api.getClubData(), []);
}
