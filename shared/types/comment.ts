export type CommentType = 'comment' | 'reply';

export interface Comment {
  id: number;
  file_id: string;
  user_id: number;
  username: string;
  text_content: string;
  x_coord: number;
  y_coord: number;
  type: CommentType;
  parent_id: number | null;
  created_at: string;
  date_last_updated: string;
}

export interface CreateCommentRequest {
  text_content: string;
  x_coord: number;
  y_coord: number;
  type?: CommentType;
  parent_id?: number | null;
}

export interface UpdateCommentRequest {
  text_content: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
