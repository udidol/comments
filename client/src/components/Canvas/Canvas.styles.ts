import styled from 'styled-components';

// Container for the entire canvas area
export const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
`;

// The grid that scales with zoom
export const CanvasGrid = styled.div`
  position: absolute;
  top: -50000px;
  left: -50000px;
  width: 100000px;
  height: 100000px;
  background-image: linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
  background-size: 50px 50px;
`;

// Fixed UI components - these NEVER move with zoom/pan
export const Toolbar = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const UserInfo = styled.span`
  font-size: 14px;
  color: #666;
`;

export const LogoutButton = styled.button`
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

export const ZoomLevel = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  font-size: 13px;
  color: #666;
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 500;
`;

export const HelpText = styled.div`
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9999;
  font-size: 13px;
  color: #999;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

interface AddCommentButtonProps {
  $active: boolean;
}

export const AddCommentButton = styled.button<AddCommentButtonProps>`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.$active ? "#a78bfa" : "white")};
  color: ${(props) => (props.$active ? "white" : "#888")};
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-family: inherit;
  &:hover {
    background: ${(props) => (props.$active ? "#9061f9" : "#f5f5f5")};
  }
`;

export const Loading = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  pointer-events: none;
  z-index: 1;
`;

// Overlay for comments - sits on top of the transform layer
// Uses a trick: pointer-events auto for clicks, but wheel events pass through
export const CommentsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

// Wrapper for each comment that captures clicks but passes wheel events through
export const CommentWrapper = styled.div`
  pointer-events: auto;
  touch-action: none;
`;
