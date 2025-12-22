import styled from 'styled-components';

// Styled Components - Closed state avatar
interface AvatarContainerProps {
  $screenX: number;
  $screenY: number;
}

export const AvatarContainer = styled.div<AvatarContainerProps>`
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

export const AvatarInner = styled.div<AvatarInnerProps>`
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

export const ReplyBadge = styled.div`
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

export const CommentContainer = styled.div<CommentContainerProps>`
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
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface AvatarSmallProps {
  $color: string;
}

export const AvatarSmall = styled.div<AvatarSmallProps>`
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

export const Username = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: #333;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Menu
export const MenuContainer = styled.div`
  position: relative;
`;

export const MenuButton = styled.button`
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

export const Menu = styled.div`
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

export const MenuItem = styled.button`
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

export const MenuItemDanger = styled(MenuItem)`
  color: #e53e3e;

  &:hover {
    background: #fee;
  }
`;

export const CloseButton = styled.button`
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
export const Content = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const Timestamp = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 8px;
`;

// Edit mode
export const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Textarea = styled.textarea`
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

export const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const CancelButton = styled.button`
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

export const SaveButton = styled.button`
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
export const RepliesSection = styled.div`
  margin-top: 12px;
`;

export const RepliesDivider = styled.div`
  height: 1px;
  background: #eee;
  margin-bottom: 12px;
`;

export const ReplyContainer = styled.div`
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 2px solid #eee;
`;

export const ReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

export const ReplyAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

interface ReplyAvatarProps {
  $color: string;
}

export const ReplyAvatar = styled.div<ReplyAvatarProps>`
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

export const ReplyUsername = styled.span`
  font-weight: 600;
  font-size: 12px;
  color: #555;
`;

export const ReplyContent = styled.div`
  font-size: 13px;
  line-height: 1.4;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ReplyTimestamp = styled.div`
  font-size: 10px;
  color: #aaa;
  margin-top: 4px;
`;

export const ReplyTextarea = styled.textarea`
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
export const ReplyInputContainer = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const ReplyInput = styled.input`
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

export const ReplySubmitButton = styled.button`
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
