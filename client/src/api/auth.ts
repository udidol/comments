import { useMutation } from '@tanstack/react-query';
import apiClient from './client';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, LoginResponse } from '@shared/types';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.access_token, data.user);
    },
  });
}
