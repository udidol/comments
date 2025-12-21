import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  PaginatedResponse,
} from '@shared/types';

export function useComments(page: number = 1, pageSize: number = 100) {
  return useQuery({
    queryKey: ['comments', page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<Comment>> => {
      const { data } = await apiClient.get('/comments', {
        params: { page, page_size: pageSize },
      });
      return data;
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: CreateCommentRequest): Promise<Comment> => {
      const { data } = await apiClient.post<Comment>('/comments', comment);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: UpdateCommentRequest & { id: number }): Promise<Comment> => {
      const { data } = await apiClient.patch<Comment>(`/comments/${id}`, update);
      return data;
    },
    onMutate: async ({ id, text_content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['comments'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<PaginatedResponse<Comment>>(['comments', 1, 100]);

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Comment>>(['comments', 1, 100], {
          ...previousData,
          data: previousData.data.map((comment) =>
            comment.id === id
              ? { ...comment, text_content, date_last_updated: new Date().toISOString() }
              : comment
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['comments', 1, 100], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
