import { useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useCanvasStore } from '../store/canvasStore';
import { useAuthStore } from '../store/authStore';
import { useComments } from '../api/comments';
import { Comment } from './Comment';
import { CommentForm } from './CommentForm';
import type { Comment as CommentType } from '@shared/types';

// Styled Components
interface CanvasContainerProps {
  $commentMode: boolean;
}

const CanvasContainer = styled.div<CanvasContainerProps>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
  position: relative;
  cursor: ${(props) => (props.$commentMode ? 'crosshair' : 'grab')};
`;

// Transform layer for the grid background only (scales with zoom)
interface GridTransformLayerProps {
  $scale: number;
  $panX: number;
  $panY: number;
}

const GridTransformLayer = styled.div<GridTransformLayerProps>`
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  transform: translate(${(props) => props.$panX}px, ${(props) => props.$panY}px) scale(${(props) => props.$scale});
  will-change: transform;
  pointer-events: none;
`;

const CanvasGrid = styled.div`
  position: absolute;
  top: -50000px;
  left: -50000px;
  width: 100000px;
  height: 100000px;
  background-image: linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
  background-size: 50px 50px;
`;

const Toolbar = styled.div`
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

const UserInfo = styled.span`
  font-size: 14px;
  color: #666;
`;

const LogoutButton = styled.button`
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

const ZoomLevel = styled.div`
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

const HelpText = styled.div`
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

const AddCommentButton = styled.button<AddCommentButtonProps>`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.$active ? '#a78bfa' : 'white')};
  color: ${(props) => (props.$active ? 'white' : '#888')};
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-family: inherit;

  &:hover {
    background: ${(props) => (props.$active ? '#9061f9' : '#f5f5f5')};
  }
`;

const Loading = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  pointer-events: none;
  z-index: 1;
`;

// Bubble icon SVG component
function BubbleIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid="canvas-bubble-icon"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const hasCenteredOnComments = useRef(false);

  const {
    panX,
    panY,
    scale,
    setPan,
    setScale,
    selectComment,
    setNewCommentPosition,
    newCommentPosition,
    commentMode,
    setCommentMode,
  } = useCanvasStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading } = useComments();

  // Organize comments: separate main comments from replies
  const { mainComments, repliesByParentId } = useMemo(() => {
    if (!data?.data) return { mainComments: [], repliesByParentId: new Map<number, CommentType[]>() };

    const main: CommentType[] = [];
    const replies = new Map<number, CommentType[]>();

    for (const comment of data.data) {
      if (comment.type === 'comment') {
        main.push(comment);
      } else if (comment.parent_id) {
        const existing = replies.get(comment.parent_id) || [];
        existing.push(comment);
        replies.set(comment.parent_id, existing);
      }
    }

    return { mainComments: main, repliesByParentId: replies };
  }, [data?.data]);

  // Center view on comments when they first load
  useEffect(() => {
    if (mainComments.length && !hasCenteredOnComments.current && containerRef.current) {
      hasCenteredOnComments.current = true;

      // Calculate bounding box of main comments only
      const minX = Math.min(...mainComments.map(c => c.x_coord));
      const maxX = Math.max(...mainComments.map(c => c.x_coord));
      const minY = Math.min(...mainComments.map(c => c.y_coord));
      const maxY = Math.max(...mainComments.map(c => c.y_coord));

      // Center of all comments
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Center of viewport
      const rect = containerRef.current.getBoundingClientRect();
      const viewportCenterX = rect.width / 2;
      const viewportCenterY = rect.height / 2;

      // Set pan to center comments in viewport
      setPan(viewportCenterX - centerX, viewportCenterY - centerY);
    }
  }, [mainComments, setPan]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !commentMode) {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        setPan(panX + dx, panY + dy);
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    },
    [panX, panY, setPan],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Mouse position relative to container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new scale (smaller delta = slower zoom)
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(3, scale * delta));

    // Calculate the canvas point under the cursor
    const canvasX = (mouseX - panX) / scale;
    const canvasY = (mouseY - panY) / scale;

    // Adjust pan so the same canvas point stays under the cursor
    const newPanX = mouseX - canvasX * newScale;
    const newPanY = mouseY - canvasY * newScale;

    setPan(newPanX, newPanY);
    setScale(newScale);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the container or grid
    const target = e.target as HTMLElement;
    if (e.target !== e.currentTarget && !target.hasAttribute('data-canvas-grid')) {
      return;
    }

    if (commentMode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panX) / scale;
      const y = (e.clientY - rect.top - panY) / scale;
      setNewCommentPosition({ x, y });
      setCommentMode(false);
    } else {
      selectComment(null);
      setNewCommentPosition(null);
    }
  };

  const handleAddCommentClick = () => {
    setCommentMode(true);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Calculate screen position from canvas coordinates
  const toScreenPosition = (x: number, y: number) => ({
    x: x * scale + panX,
    y: y * scale + panY,
  });

  // Fixed UI elements rendered via portal to body
  const zoomPercent = Math.round(scale * 100);

  const fixedUI = createPortal(
    <>
      {/* Toolbar */}
      <Toolbar data-testid="canvas-toolbar">
        <UserInfo data-testid="canvas-user-info">Signed in as {user?.username}</UserInfo>
        <LogoutButton onClick={logout} data-testid="canvas-logout-button">
          Sign Out
        </LogoutButton>
      </Toolbar>

      {/* Zoom level */}
      <ZoomLevel data-testid="canvas-zoom-level">{zoomPercent}%</ZoomLevel>

      {/* Help text */}
      <HelpText data-testid="canvas-help-text">Drag to pan | Scroll to zoom</HelpText>

      {/* Add Comment Button */}
      <AddCommentButton
        onClick={handleAddCommentClick}
        $active={commentMode}
        data-testid="canvas-add-comment-button"
      >
        <BubbleIcon color={commentMode ? 'white' : '#888'} />
        <span>Add comment</span>
      </AddCommentButton>
    </>,
    document.body
  );

  return (
    <>
      <CanvasContainer
        ref={containerRef}
        $commentMode={commentMode}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onClick={handleContainerClick}
        data-testid="canvas-container"
      >
        {/* Grid background in its own transform layer (scales with zoom) */}
        <GridTransformLayer
          $scale={scale}
          $panX={panX}
          $panY={panY}
          data-testid="canvas-grid-layer"
        >
          <CanvasGrid
            data-canvas-grid
            data-testid="canvas-grid"
          />
        </GridTransformLayer>

        {/* Loading indicator */}
        {isLoading && (
          <Loading data-testid="canvas-loading">Loading comments...</Loading>
        )}

        {/* Comments - at top level, don't scale with zoom */}
        {mainComments.map((comment) => {
          const screenPos = toScreenPosition(comment.x_coord, comment.y_coord);
          const replies = repliesByParentId.get(comment.id) || [];
          return (
            <Comment
              key={comment.id}
              comment={comment}
              replies={replies}
              screenX={screenPos.x}
              screenY={screenPos.y}
            />
          );
        })}

        {/* New comment form */}
        {newCommentPosition && (
          <CommentForm
            screenX={toScreenPosition(newCommentPosition.x, newCommentPosition.y).x}
            screenY={toScreenPosition(newCommentPosition.x, newCommentPosition.y).y}
          />
        )}
      </CanvasContainer>

      {fixedUI}
    </>
  );
}
