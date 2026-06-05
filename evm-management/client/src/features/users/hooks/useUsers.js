import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { useToast } from '@/components/common/Toast';

export function useUsers(filters = {}) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 1. Query users
  const usersQuery = useQuery({
    queryKey: ['usersList', filters],
    queryFn: async () => {
      const res = await usersApi.list(filters);
      return {
        items: res.data.data || [],
        totalItems: res.data.pagination?.total || 0,
        totalPages: res.data.pagination?.totalPages || 0,
      };
    },
  });

  // 2. Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['usersList']);
      addToast('User created successfully', 'success');
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || 'Failed to create user account.', 'error');
    },
  });

  // 3. Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['usersList']);
      addToast('User updated successfully', 'success');
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || 'Failed to update user account.', 'error');
    },
  });

  // 4. Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id) => usersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['usersList']);
      addToast('User account status toggled', 'success');
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || 'Failed to change user status.', 'error');
    },
  });

  return {
    users: usersQuery.data?.items || [],
    totalPages: usersQuery.data?.totalPages || 0,
    totalItems: usersQuery.data?.totalItems || 0,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    refetch: usersQuery.refetch,
    
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    
    toggleStatus: toggleStatusMutation.mutateAsync,
    isToggling: toggleStatusMutation.isPending,
  };
}
