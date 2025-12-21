import { useState } from 'react';
import styled from 'styled-components';
import { useCanvasStore } from '../store/canvasStore';
import { useCreateComment } from '../api/comments';

interface ContainerProps {
  $screenX: number;
  $screenY: number;
}

const Container = styled.div<ContainerProps>`
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 12px;
  width: 260px;
  transform: translate(-50%, -100%) translateY(-10px);
  z-index: 100;
  left: ${(props) => props.$screenX}px;
  top: ${(props) => props.$screenY}px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  margin-bottom: 8px;
  box-sizing: border-box;
  font-family: inherit;

  &:focus {
    border-color: #667eea;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f5f5f5;
  }
`;

const SubmitButton = styled.button`
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #5a6fd6;
  }

  &:disabled {
    background: #a0aee8;
    cursor: not-allowed;
  }
`;

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
    <Container
      $screenX={screenX}
      $screenY={screenY}
      onClick={(e) => e.stopPropagation()}
      data-testid="comment-form-container"
    >
      <form onSubmit={handleSubmit} data-testid="comment-form">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          autoFocus
          data-testid="comment-form-textarea"
        />
        <Actions data-testid="comment-form-actions">
          <CancelButton
            type="button"
            onClick={handleCancel}
            data-testid="comment-form-cancel-button"
          >
            Cancel
          </CancelButton>
          <SubmitButton
            type="submit"
            disabled={!text.trim() || createComment.isPending}
            data-testid="comment-form-submit-button"
          >
            {createComment.isPending ? 'Posting...' : 'Post'}
          </SubmitButton>
        </Actions>
      </form>
    </Container>
  );
}
