import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authApi } from '../../../api/auth';
import type {
  GeographicAccess,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth';

export const useUser = () =>
  useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getCurrentUser(),
    retry: false,
    staleTime: 3 * 60 * 1000,
  });

export const useAuthStatus = () => {
  const userQuery = useUser();
  return {
    isAuthenticated: !!userQuery.data,
    isLoading: userQuery.isLoading,
    user: userQuery.data
  };
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Signed in');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Invalid email or password';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response: {
            data?: {
              detail?: string;
              message?: string;
            }
          }
        };
        errorMessage = axiosError.response.data?.detail ??
                      axiosError.response.data?.message ??
                      errorMessage;
      }

      toast.error(errorMessage);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Account created');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Registration failed';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response: {
            data?: {
              detail?: string;
              message?: string;
            }
          }
        };
        errorMessage = axiosError.response.data?.detail ??
                      axiosError.response.data?.message ??
                      errorMessage;
      }

      toast.error(errorMessage);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.clear();
      toast.success('Signed out');
    },
  });
};

export const useGeographicAccess = () =>
  useQuery<GeographicAccess>({
    queryKey: ['auth', 'geographic-access'],
    queryFn: () => authApi.checkGeographicAccess(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

export const useBankIDAuth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<User> => {
      const start = await authApi.bankidStart();
      let tries = 0;

      while (tries++ < 60) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const result = await authApi.bankidStatus(start.order_ref);

        if (result.status === 'complete' && result.user) {
          await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
          return result.user;
        }

        if (result.status === 'failed') {
          throw new Error('BankID failed');
        }
      }

      throw new Error('BankID timeout');
    },
    onSuccess: () => {
      toast.success('Signed in with BankID');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.toLowerCase().includes('region') ||
          errorMessage.toLowerCase().includes('bankid')) {
        toast.error('BankID is only available from Swedish IP addresses');
      } else {
        toast.error('Unable to complete BankID login');
      }
    },
  });
};
