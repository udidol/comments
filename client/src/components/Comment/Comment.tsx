import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { useCreateComment, useUpdateComment, useDeleteComment } from '../../api/comments';
import type { Comment as CommentType } from '@shared/types';
import * as S from './Comment.styles';

// Generate a consistent color based on user ID
const USER_COLORS = [
  '#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea',
  '#38b2ac', '#ed64a6', '#4299e1', '#ecc94b', '#fc8181',
];

function getUserColor(userId: number): string {
  return USER_COLORS[userId % USER_COLORS.length];
}

// Format date for "last edited" display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Single reply component
function Reply({ reply }: { reply: CommentType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editText, setEditText] = useState(reply.text_content);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isOwner = currentUser?.id === reply.user_id;
  const userColor = getUserColor(reply.user_id);
  const firstLetter = reply.username.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== reply.text_content) {
      updateComment.mutate({ id: reply.id, text_content: editText.trim() });
    }
    setIsEditing(false);
  };

  return (
    <S.ReplyContainer data-testid={`reply-${reply.id}`}>
      <S.ReplyHeader data-testid={`reply-header-${reply.id}`}>
        <S.ReplyAuthorRow data-testid={`reply-author-row-${reply.id}`}>
          <S.ReplyAvatar $color={userColor} data-testid={`reply-avatar-${reply.id}`}>
            {firstLetter}
          </S.ReplyAvatar>
          <S.ReplyUsername data-testid={`reply-username-${reply.id}`}>{reply.username}</S.ReplyUsername>
        </S.ReplyAuthorRow>
        {isOwner && !isEditing && (
          <S.MenuContainer ref={menuRef} data-testid={`reply-menu-container-${reply.id}`}>
            <S.MenuButton
              onClick={() => setShowMenu(!showMenu)}
              data-testid={`reply-menu-button-${reply.id}`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="#999">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </S.MenuButton>
            {showMenu && (
              <S.Menu data-testid={`reply-menu-${reply.id}`}>
                <S.MenuItem
                  onClick={() => { setShowMenu(false); setIsEditing(true); }}
                  data-testid={`reply-edit-button-${reply.id}`}
                >
                  Edit
                </S.MenuItem>
                <S.MenuItemDanger
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm('Delete this reply?')) deleteComment.mutate(reply.id);
                  }}
                  data-testid={`reply-delete-button-${reply.id}`}
                >
                  Delete
                </S.MenuItemDanger>
              </S.Menu>
            )}
          </S.MenuContainer>
        )}
      </S.ReplyHeader>
      {isEditing ? (
        <S.EditContainer data-testid={`reply-edit-container-${reply.id}`}>
          <S.ReplyTextarea
            value={editText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') { setEditText(reply.text_content); setIsEditing(false); }
            }}
            autoFocus
            data-testid={`reply-edit-textarea-${reply.id}`}
          />
          <S.EditActions data-testid={`reply-edit-actions-${reply.id}`}>
            <S.CancelButton
              onClick={() => { setEditText(reply.text_content); setIsEditing(false); }}
              data-testid={`reply-edit-cancel-${reply.id}`}
            >
              Cancel
            </S.CancelButton>
            <S.SaveButton onClick={handleSave} data-testid={`reply-edit-save-${reply.id}`}>
              Save
            </S.SaveButton>
          </S.EditActions>
        </S.EditContainer>
      ) : (
        <>
          <S.ReplyContent data-testid={`reply-content-${reply.id}`}>{reply.text_content}</S.ReplyContent>
          <S.ReplyTimestamp data-testid={`reply-timestamp-${reply.id}`}>
            Last edited {formatDate(reply.date_last_updated)}
          </S.ReplyTimestamp>
        </>
      )}
    </S.ReplyContainer>
  );
}

interface Props {
  comment: CommentType;
  replies: CommentType[];
  screenX: number;
  screenY: number;
}

export function Comment({ comment, replies, screenX, screenY }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editText, setEditText] = useState(comment.text_content);
  const [replyText, setReplyText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { selectComment } = useCanvasStore();
  const currentUser = useAuthStore((s) => s.user);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isOwner = currentUser?.id === comment.user_id;
  const userColor = getUserColor(comment.user_id);
  const firstLetter = comment.username.charAt(0).toUpperCase();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Update editText when comment changes
  useEffect(() => {
    if (!isEditing) {
      setEditText(comment.text_content);
    }
  }, [comment.text_content, isEditing]);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    selectComment(comment.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsEditing(false);
    setShowMenu(false);
    setReplyText('');
    selectComment(null);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsEditing(true);
    setEditText(comment.text_content);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const hasReplies = replies.length > 0;
    const message = hasReplies
      ? `Delete this comment and its ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}?`
      : 'Delete this comment?';
    if (confirm(message)) {
      deleteComment.mutate(comment.id);
    }
  };

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== comment.text_content) {
      updateComment.mutate({ id: comment.id, text_content: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(comment.text_content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      createComment.mutate({
        text_content: replyText.trim(),
        x_coord: comment.x_coord,
        y_coord: comment.y_coord,
        type: 'reply',
        parent_id: comment.id,
      });
      setReplyText('');
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReplySubmit();
    }
  };

  // Closed state - just the avatar circle
  if (!isOpen) {
    return (
      <S.AvatarContainer
        onClick={handleAvatarClick}
        $screenX={screenX}
        $screenY={screenY}
        data-comment
        data-testid={`comment-avatar-${comment.id}`}
      >
        <S.AvatarInner $color={userColor} data-testid={`comment-avatar-inner-${comment.id}`}>
          {firstLetter}
        </S.AvatarInner>
        {replies.length > 0 && (
          <S.ReplyBadge data-testid={`comment-reply-badge-${comment.id}`}>{replies.length}</S.ReplyBadge>
        )}
      </S.AvatarContainer>
    );
  }

  // Open state
  return (
    <S.CommentContainer
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      $screenX={screenX}
      $screenY={screenY}
      data-comment
      data-testid={`comment-container-${comment.id}`}
    >
      {/* Header */}
      <S.Header data-testid={`comment-header-${comment.id}`}>
        <S.AuthorRow data-testid={`comment-author-row-${comment.id}`}>
          <S.AvatarSmall $color={userColor} data-testid={`comment-author-avatar-${comment.id}`}>
            {firstLetter}
          </S.AvatarSmall>
          <S.Username data-testid={`comment-username-${comment.id}`}>{comment.username}</S.Username>
        </S.AuthorRow>
        <S.HeaderActions data-testid={`comment-header-actions-${comment.id}`}>
          {isOwner && !isEditing && (
            <S.MenuContainer ref={menuRef} data-testid={`comment-menu-container-${comment.id}`}>
              <S.MenuButton
                onClick={handleMenuClick}
                data-testid={`comment-menu-button-${comment.id}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#666">
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </S.MenuButton>
              {showMenu && (
                <S.Menu data-testid={`comment-menu-${comment.id}`}>
                  <S.MenuItem
                    onClick={handleEdit}
                    data-testid={`comment-edit-button-${comment.id}`}
                  >
                    Edit
                  </S.MenuItem>
                  <S.MenuItemDanger
                    onClick={handleDelete}
                    data-testid={`comment-delete-button-${comment.id}`}
                  >
                    Delete
                  </S.MenuItemDanger>
                </S.Menu>
              )}
            </S.MenuContainer>
          )}
          <S.CloseButton onClick={handleClose} data-testid={`comment-close-button-${comment.id}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="#999" strokeWidth="2">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </S.CloseButton>
        </S.HeaderActions>
      </S.Header>

      {/* Main comment content */}
      {isEditing ? (
        <S.EditContainer data-testid={`comment-edit-container-${comment.id}`}>
          <S.Textarea
            ref={textareaRef}
            value={editText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid={`comment-edit-textarea-${comment.id}`}
          />
          <S.EditActions data-testid={`comment-edit-actions-${comment.id}`}>
            <S.CancelButton
              onClick={handleCancel}
              data-testid={`comment-edit-cancel-${comment.id}`}
            >
              Cancel
            </S.CancelButton>
            <S.SaveButton
              onClick={handleSave}
              disabled={!editText.trim()}
              data-testid={`comment-edit-save-${comment.id}`}
            >
              Save
            </S.SaveButton>
          </S.EditActions>
        </S.EditContainer>
      ) : (
        <>
          <S.Content data-testid={`comment-content-${comment.id}`}>{comment.text_content}</S.Content>
          <S.Timestamp data-testid={`comment-timestamp-${comment.id}`}>
            Last edited {formatDate(comment.date_last_updated)}
          </S.Timestamp>
        </>
      )}

      {/* Replies section */}
      {replies.length > 0 && (
        <S.RepliesSection data-testid={`comment-replies-section-${comment.id}`}>
          <S.RepliesDivider data-testid={`comment-replies-divider-${comment.id}`} />
          {replies.map((reply) => (
            <Reply key={reply.id} reply={reply} />
          ))}
        </S.RepliesSection>
      )}

      {/* Reply input */}
      <S.ReplyInputContainer data-testid={`comment-reply-input-container-${comment.id}`}>
        <S.ReplyInput
          type="text"
          value={replyText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplyText(e.target.value)}
          onKeyDown={handleReplyKeyDown}
          placeholder="Reply..."
          data-testid={`comment-reply-input-${comment.id}`}
        />
        {replyText.trim() && (
          <S.ReplySubmitButton
            onClick={handleReplySubmit}
            disabled={createComment.isPending}
            data-testid={`comment-reply-submit-${comment.id}`}
          >
            {createComment.isPending ? '...' : 'Send'}
          </S.ReplySubmitButton>
        )}
      </S.ReplyInputContainer>
    </S.CommentContainer>
  );
}
