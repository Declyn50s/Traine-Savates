import { api } from '../services/api';
import { useApi } from './useApi';

export function usePracticalInfo() {
  return useApi(() => api.getPracticalInfo(), []);
}

export function useFaq() {
  return useApi(() => api.getFaq(), []);
}
