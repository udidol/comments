import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useCanvasStore } from '../store/canvasStore';
import { useAuthStore } from '../store/authStore';
import { useCreateComment, useUpdateComment, useDeleteComment } from '../api/comments';
import type { Comment as CommentType } from '@shared/types';

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

// Styled Components - Closed state avatar
interface AvatarContainerProps {
  $screenX: number;
  $screenY: number;
}

const AvatarContainer = styled.div<AvatarContainerProps>`
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  left: ${(props) => props.$screenX}px;
  top: ${(props) => props.$screenY}px;
`;

interface AvatarInnerProps {
  $color: string;
}

const AvatarInner = styled.div<AvatarInnerProps>`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 600;
  background: ${(props) => props.$color};
`;

const ReplyBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #667eea;
  color: white;
  font-size: 10px;
  font-weight: 600;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Open state container
interface CommentContainerProps {
  $screenX: number;
  $screenY: number;
}

const CommentContainer = styled.div<CommentContainerProps>`
  position: absolute;
  transform: translate(-50%, -100%) translateY(-10px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px;
  min-width: 280px;
  max-width: 350px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
  left: ${(props) => props.$screenX}px;
  top: ${(props) => props.$screenY}px;
`;

// Header
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface AvatarSmallProps {
  $color: string;
}

const AvatarSmall = styled.div<AvatarSmallProps>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 600;
  background: ${(props) => props.$color};
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: #333;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Menu
const MenuContainer = styled.div`
  position: relative;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f5f5;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  min-width: 100px;
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #333;

  &:hover {
    background: #f5f5f5;
  }
`;

const MenuItemDanger = styled(MenuItem)`
  color: #e53e3e;

  &:hover {
    background: #fee;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f5f5;
  }
`;

// Content
const Content = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Timestamp = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 8px;
`;

// Edit mode
const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: #667eea;
  }
`;

const EditActions = styled.div`
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
  color: #666;

  &:hover {
    background: #f5f5f5;
  }
`;

const SaveButton = styled.button`
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

// Replies section
const RepliesSection = styled.div`
  margin-top: 12px;
`;

const RepliesDivider = styled.div`
  height: 1px;
  background: #eee;
  margin-bottom: 12px;
`;

const ReplyContainer = styled.div`
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 2px solid #eee;
`;

const ReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const ReplyAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

interface ReplyAvatarProps {
  $color: string;
}

const ReplyAvatar = styled.div<ReplyAvatarProps>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px;
  font-weight: 600;
  background: ${(props) => props.$color};
`;

const ReplyUsername = styled.span`
  font-weight: 600;
  font-size: 12px;
  color: #555;
`;

const ReplyContent = styled.div`
  font-size: 13px;
  line-height: 1.4;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ReplyTimestamp = styled.div`
  font-size: 10px;
  color: #aaa;
  margin-top: 4px;
`;

const ReplyTextarea = styled.textarea`
  width: 100%;
  min-height: 50px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: #667eea;
  }
`;

// Reply input
const ReplyInputContainer = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ReplyInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: #667eea;
  }
`;

const ReplySubmitButton = styled.button`
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;

  &:hover {
    background: #5a6fd6;
  }

  &:disabled {
    background: #a0aee8;
    cursor: not-allowed;
  }
`;

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
    <ReplyContainer data-testid={`reply-${reply.id}`}>
      <ReplyHeader data-testid={`reply-header-${reply.id}`}>
        <ReplyAuthorRow data-testid={`reply-author-row-${reply.id}`}>
          <ReplyAvatar $color={userColor} data-testid={`reply-avatar-${reply.id}`}>
            {firstLetter}
          </ReplyAvatar>
          <ReplyUsername data-testid={`reply-username-${reply.id}`}>{reply.username}</ReplyUsername>
        </ReplyAuthorRow>
        {isOwner && !isEditing && (
          <MenuContainer ref={menuRef} data-testid={`reply-menu-container-${reply.id}`}>
            <MenuButton
              onClick={() => setShowMenu(!showMenu)}
              data-testid={`reply-menu-button-${reply.id}`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="#999">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </MenuButton>
            {showMenu && (
              <Menu data-testid={`reply-menu-${reply.id}`}>
                <MenuItem
                  onClick={() => { setShowMenu(false); setIsEditing(true); }}
                  data-testid={`reply-edit-button-${reply.id}`}
                >
                  Edit
                </MenuItem>
                <MenuItemDanger
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm('Delete this reply?')) deleteComment.mutate(reply.id);
                  }}
                  data-testid={`reply-delete-button-${reply.id}`}
                >
                  Delete
                </MenuItemDanger>
              </Menu>
            )}
          </MenuContainer>
        )}
      </ReplyHeader>
      {isEditing ? (
        <EditContainer data-testid={`reply-edit-container-${reply.id}`}>
          <ReplyTextarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') { setEditText(reply.text_content); setIsEditing(false); }
            }}
            autoFocus
            data-testid={`reply-edit-textarea-${reply.id}`}
          />
          <EditActions data-testid={`reply-edit-actions-${reply.id}`}>
            <CancelButton
              onClick={() => { setEditText(reply.text_content); setIsEditing(false); }}
              data-testid={`reply-edit-cancel-${reply.id}`}
            >
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSave} data-testid={`reply-edit-save-${reply.id}`}>
              Save
            </SaveButton>
          </EditActions>
        </EditContainer>
      ) : (
        <>
          <ReplyContent data-testid={`reply-content-${reply.id}`}>{reply.text_content}</ReplyContent>
          <ReplyTimestamp data-testid={`reply-timestamp-${reply.id}`}>
            Last edited {formatDate(reply.date_last_updated)}
          </ReplyTimestamp>
        </>
      )}
    </ReplyContainer>
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
      <AvatarContainer
        onClick={handleAvatarClick}
        $screenX={screenX}
        $screenY={screenY}
        data-testid={`comment-avatar-${comment.id}`}
      >
        <AvatarInner $color={userColor} data-testid={`comment-avatar-inner-${comment.id}`}>
          {firstLetter}
        </AvatarInner>
        {replies.length > 0 && (
          <ReplyBadge data-testid={`comment-reply-badge-${comment.id}`}>{replies.length}</ReplyBadge>
        )}
      </AvatarContainer>
    );
  }

  // Open state
  return (
    <CommentContainer
      onClick={(e) => e.stopPropagation()}
      $screenX={screenX}
      $screenY={screenY}
      data-testid={`comment-container-${comment.id}`}
    >
      {/* Header */}
      <Header data-testid={`comment-header-${comment.id}`}>
        <AuthorRow data-testid={`comment-author-row-${comment.id}`}>
          <AvatarSmall $color={userColor} data-testid={`comment-author-avatar-${comment.id}`}>
            {firstLetter}
          </AvatarSmall>
          <Username data-testid={`comment-username-${comment.id}`}>{comment.username}</Username>
        </AuthorRow>
        <HeaderActions data-testid={`comment-header-actions-${comment.id}`}>
          {isOwner && !isEditing && (
            <MenuContainer ref={menuRef} data-testid={`comment-menu-container-${comment.id}`}>
              <MenuButton
                onClick={handleMenuClick}
                data-testid={`comment-menu-button-${comment.id}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#666">
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </MenuButton>
              {showMenu && (
                <Menu data-testid={`comment-menu-${comment.id}`}>
                  <MenuItem
                    onClick={handleEdit}
                    data-testid={`comment-edit-button-${comment.id}`}
                  >
                    Edit
                  </MenuItem>
                  <MenuItemDanger
                    onClick={handleDelete}
                    data-testid={`comment-delete-button-${comment.id}`}
                  >
                    Delete
                  </MenuItemDanger>
                </Menu>
              )}
            </MenuContainer>
          )}
          <CloseButton onClick={handleClose} data-testid={`comment-close-button-${comment.id}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="#999" strokeWidth="2">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </CloseButton>
        </HeaderActions>
      </Header>

      {/* Main comment content */}
      {isEditing ? (
        <EditContainer data-testid={`comment-edit-container-${comment.id}`}>
          <Textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid={`comment-edit-textarea-${comment.id}`}
          />
          <EditActions data-testid={`comment-edit-actions-${comment.id}`}>
            <CancelButton
              onClick={handleCancel}
              data-testid={`comment-edit-cancel-${comment.id}`}
            >
              Cancel
            </CancelButton>
            <SaveButton
              onClick={handleSave}
              disabled={!editText.trim()}
              data-testid={`comment-edit-save-${comment.id}`}
            >
              Save
            </SaveButton>
          </EditActions>
        </EditContainer>
      ) : (
        <>
          <Content data-testid={`comment-content-${comment.id}`}>{comment.text_content}</Content>
          <Timestamp data-testid={`comment-timestamp-${comment.id}`}>
            Last edited {formatDate(comment.date_last_updated)}
          </Timestamp>
        </>
      )}

      {/* Replies section */}
      {replies.length > 0 && (
        <RepliesSection data-testid={`comment-replies-section-${comment.id}`}>
          <RepliesDivider data-testid={`comment-replies-divider-${comment.id}`} />
          {replies.map((reply) => (
            <Reply key={reply.id} reply={reply} />
          ))}
        </RepliesSection>
      )}

      {/* Reply input */}
      <ReplyInputContainer data-testid={`comment-reply-input-container-${comment.id}`}>
        <ReplyInput
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleReplyKeyDown}
          placeholder="Reply..."
          data-testid={`comment-reply-input-${comment.id}`}
        />
        {replyText.trim() && (
          <ReplySubmitButton
            onClick={handleReplySubmit}
            disabled={createComment.isPending}
            data-testid={`comment-reply-submit-${comment.id}`}
          >
            {createComment.isPending ? '...' : 'Send'}
          </ReplySubmitButton>
        )}
      </ReplyInputContainer>
    </CommentContainer>
  );
}
