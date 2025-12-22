import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useCreateComment } from '../../api/comments';
import * as S from './CommentForm.styles';

interface Props {
  screenX: number;
  screenY: number;
}

export function CommentForm({ screenX, screenY }: Props) {
  const [text, setText] = useState('');
  const { newCommentPosition, setNewCommentPosition } = useCanvasStore();
  const createComment = useCreateComment();

  if (!newCommentPosition) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      createComment.mutate({
        text_content: text.trim(),
        x_coord: newCommentPosition.x,
        y_coord: newCommentPosition.y,
      });
      setText('');
      setNewCommentPosition(null);
    }
  };

  const handleCancel = () => {
    setText('');
    setNewCommentPosition(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <S.Container
      $screenX={screenX}
      $screenY={screenY}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      data-comment
      data-testid="comment-form-container"
    >
      <form onSubmit={handleSubmit} data-testid="comment-form">
        <S.Textarea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          autoFocus
          data-testid="comment-form-textarea"
        />
        <S.Actions data-testid="comment-form-actions">
          <S.CancelButton
            type="button"
            onClick={handleCancel}
            data-testid="comment-form-cancel-button"
          >
            Cancel
          </S.CancelButton>
          <S.SubmitButton
            type="submit"
            disabled={!text.trim() || createComment.isPending}
            data-testid="comment-form-submit-button"
          >
            {createComment.isPending ? 'Posting...' : 'Post'}
          </S.SubmitButton>
        </S.Actions>
      </form>
    </S.Container>
  );
}
