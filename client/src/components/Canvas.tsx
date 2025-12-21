import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { TransformWrapper, TransformComponent, useControls, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useCanvasStore } from '../store/canvasStore';
import { useAuthStore } from '../store/authStore';
import { useComments } from '../api/comments';
import { Comment } from './Comment';
import { CommentForm } from './CommentForm';
import type { Comment as CommentType } from '@shared/types';

// Container for the entire canvas area
const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
`;

// The grid that scales with zoom
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

// Fixed UI components - these NEVER move with zoom/pan
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
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  pointer-events: none;
  z-index: 1;
`;

// Overlay for comments - sits on top of the transform layer
const CommentsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;

  & > * {
    pointer-events: auto;
  }
`;

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
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Inner component that has access to transform controls
function CanvasContent({
  mainComments,
  repliesByParentId,
  isLoading,
  scale,
  positionX,
  positionY,
}: {
  mainComments: CommentType[];
  repliesByParentId: Map<number, CommentType[]>;
  isLoading: boolean;
  scale: number;
  positionX: number;
  positionY: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasCenteredOnComments = useRef(false);
  const { setTransform } = useControls();

  const {
    selectComment,
    setNewCommentPosition,
    newCommentPosition,
    commentMode,
    setCommentMode,
  } = useCanvasStore();

  // Center view on comments when they first load
  useEffect(() => {
    if (mainComments.length && !hasCenteredOnComments.current && wrapperRef.current) {
      hasCenteredOnComments.current = true;

      const minX = Math.min(...mainComments.map(c => c.x_coord));
      const maxX = Math.max(...mainComments.map(c => c.x_coord));
      const minY = Math.min(...mainComments.map(c => c.y_coord));
      const maxY = Math.max(...mainComments.map(c => c.y_coord));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportCenterX = rect.width / 2;
      const viewportCenterY = rect.height / 2;

      setTransform(viewportCenterX - centerX, viewportCenterY - centerY, 1);
    }
  }, [mainComments, setTransform]);

  // Convert canvas coordinates to screen position
  const toScreenPosition = useCallback((x: number, y: number) => ({
    x: x * scale + positionX,
    y: y * scale + positionY,
  }), [scale, positionX, positionY]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only handle clicks on the wrapper itself, not children
    if (e.target !== e.currentTarget) return;

    if (commentMode) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Convert screen position to canvas coordinates
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - positionX) / scale;
      const canvasY = (screenY - positionY) / scale;

      setNewCommentPosition({ x: canvasX, y: canvasY });
      setCommentMode(false);
    } else {
      selectComment(null);
      setNewCommentPosition(null);
    }
  };

  return (
    <CanvasWrapper
      ref={wrapperRef}
      onClick={handleCanvasClick}
      style={{ cursor: commentMode ? 'crosshair' : 'grab' }}
    >
      {/* The zoom/pan layer - ONLY contains the grid */}
      <TransformComponent
        wrapperStyle={{
          width: '100%',
          height: '100%',
        }}
        contentStyle={{
          width: '100%',
          height: '100%',
        }}
      >
        <CanvasGrid />
      </TransformComponent>

      {/* Comments overlay - NOT inside TransformComponent */}
      <CommentsOverlay>
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

        {newCommentPosition && (
          <CommentForm
            screenX={toScreenPosition(newCommentPosition.x, newCommentPosition.y).x}
            screenY={toScreenPosition(newCommentPosition.x, newCommentPosition.y).y}
          />
        )}
      </CommentsOverlay>

      {isLoading && <Loading>Loading comments...</Loading>}
    </CanvasWrapper>
  );
}

export function Canvas() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading } = useComments();
  const { commentMode, setCommentMode, setScale, setPan } = useCanvasStore();

  // Local state for transform (synced to store)
  const [transformState, setTransformState] = useState({ scale: 1, positionX: 0, positionY: 0 });

  // Organize comments
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

  const handleAddCommentClick = () => {
    setCommentMode(true);
  };

  const handleTransform = (ref: ReactZoomPanPinchRef) => {
    const { scale, positionX, positionY } = ref.state;
    setTransformState({ scale, positionX, positionY });
    setScale(scale);
    setPan(positionX, positionY);
  };

  const zoomPercent = Math.round(transformState.scale * 100);

  // Fixed UI - rendered via portal, completely outside transform system
  const fixedUI = createPortal(
    <>
      <Toolbar>
        <UserInfo>Signed in as {user?.username}</UserInfo>
        <LogoutButton onClick={logout}>Sign Out</LogoutButton>
      </Toolbar>
      <ZoomLevel>{zoomPercent}%</ZoomLevel>
      <HelpText>Drag to pan | Scroll to zoom</HelpText>
      <AddCommentButton onClick={handleAddCommentClick} $active={commentMode}>
        <BubbleIcon color={commentMode ? 'white' : '#888'} />
        <span>Add comment</span>
      </AddCommentButton>
    </>,
    document.body
  );

  return (
    <>
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        limitToBounds={false}
        centerOnInit={false}
        panning={{ velocityDisabled: true }}
        pinch={{ disabled: false }}
        wheel={{ smoothStep: 0.05 }}
        doubleClick={{ disabled: true }}
        onTransformed={handleTransform}
      >
        <CanvasContent
          mainComments={mainComments}
          repliesByParentId={repliesByParentId}
          isLoading={isLoading}
          scale={transformState.scale}
          positionX={transformState.positionX}
          positionY={transformState.positionY}
        />
      </TransformWrapper>
      {fixedUI}
    </>
  );
}
