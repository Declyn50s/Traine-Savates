import { api } from '../services/api';
import { useApi } from './useApi';

export function useSponsors() {
  return useApi(() => api.getSponsors(), []);
}
