import { api } from '../services/api';
import { useApi } from './useApi';

export function useActiveEdition() {
  return useApi(() => api.getActiveEdition(), []);
}

export function useEditionFull(slug: string) {
  return useApi(() => api.getEditionFull(slug), [slug]);
}
