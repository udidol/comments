import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { useCanvasStore } from "../../store/canvasStore";
import { useAuthStore } from "../../store/authStore";
import { useComments } from "../../api/comments";
import { Comment } from "../Comment/Comment";
import { CommentForm } from "../CommentForm/CommentForm";
import type { Comment as CommentType } from "@shared/types";
import * as S from "./Canvas.styles";

function BubbleIcon({ color = "currentColor" }: { color?: string }) {
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
  onWheel,
  commentMode,
  setCommentMode,
}: {
  mainComments: CommentType[];
  repliesByParentId: Map<number, CommentType[]>;
  isLoading: boolean;
  scale: number;
  positionX: number;
  positionY: number;
  onWheel: (e: React.WheelEvent) => void;
  commentMode: boolean;
  setCommentMode: (active: boolean) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasCenteredOnComments = useRef(false);
  const justPlacedComment = useRef(false);
  const { setTransform } = useControls();

  const { selectComment, setNewCommentPosition, newCommentPosition } =
    useCanvasStore();

  // Center view on comments when they first load
  useEffect(() => {
    if (
      mainComments.length &&
      !hasCenteredOnComments.current &&
      wrapperRef.current
    ) {
      hasCenteredOnComments.current = true;

      const minX = Math.min(...mainComments.map((c) => c.x_coord));
      const maxX = Math.max(...mainComments.map((c) => c.x_coord));
      const minY = Math.min(...mainComments.map((c) => c.y_coord));
      const maxY = Math.max(...mainComments.map((c) => c.y_coord));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportCenterX = rect.width / 2;
      const viewportCenterY = rect.height / 2;

      setTransform(viewportCenterX - centerX, viewportCenterY - centerY, 1);
    }
  }, [mainComments, setTransform]);

  // Convert canvas coordinates to screen position
  const toScreenPosition = useCallback(
    (x: number, y: number) => ({
      x: x * scale + positionX,
      y: y * scale + positionY,
    }),
    [scale, positionX, positionY]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Don't handle clicks on comments
    const target = e.target as HTMLElement;
    if (target.closest("[data-comment]")) return;

    if (commentMode) {
      // Add comment mode: place new comment at click position
      e.stopPropagation();
      e.preventDefault();

      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - positionX) / scale;
      const canvasY = (screenY - positionY) / scale;

      setNewCommentPosition({ x: canvasX, y: canvasY });
      setCommentMode(false);
      justPlacedComment.current = true;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Skip if we just placed a comment (mousedown already handled it)
    if (justPlacedComment.current) {
      justPlacedComment.current = false;
      return;
    }

    // Don't handle clicks on comments
    const target = e.target as HTMLElement;
    if (target.closest("[data-comment]")) return;

    // Normal mode: deselect
    selectComment(null);
    setNewCommentPosition(null);
  };

  return (
    <S.CanvasWrapper
      ref={wrapperRef}
      onMouseDownCapture={handleCanvasMouseDown}
      onClick={handleCanvasClick}
      style={{ cursor: commentMode ? "crosshair" : "grab" }}
    >
      {/* The zoom/pan layer - ONLY contains the grid */}
      <TransformComponent
        wrapperStyle={{
          width: "100%",
          height: "100%",
        }}
        contentStyle={{
          width: "100%",
          height: "100%",
        }}
      >
        <S.CanvasGrid />
      </TransformComponent>

      {/* Comments overlay - NOT inside TransformComponent */}
      <S.CommentsOverlay>
        {mainComments.map((comment) => {
          const screenPos = toScreenPosition(comment.x_coord, comment.y_coord);
          const replies = repliesByParentId.get(comment.id) || [];
          return (
            <S.CommentWrapper key={comment.id} onWheel={onWheel}>
              <Comment
                comment={comment}
                replies={replies}
                screenX={screenPos.x}
                screenY={screenPos.y}
              />
            </S.CommentWrapper>
          );
        })}

        {newCommentPosition && (
          <S.CommentWrapper onWheel={onWheel}>
            <CommentForm
              screenX={
                toScreenPosition(newCommentPosition.x, newCommentPosition.y).x
              }
              screenY={
                toScreenPosition(newCommentPosition.x, newCommentPosition.y).y
              }
            />
          </S.CommentWrapper>
        )}
      </S.CommentsOverlay>

      {isLoading && <S.Loading>Loading comments...</S.Loading>}
    </S.CanvasWrapper>
  );
}

export function Canvas() {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading } = useComments();
  const { commentMode, setCommentMode, setScale, setPan } = useCanvasStore();

  // Local state for transform (synced to store)
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2.5;

  // Handle wheel/pinch events globally on the canvas (including over comments)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!transformRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const currentScale = transformRef.current.state.scale;
    const { zoomIn, zoomOut } = transformRef.current;

    if (e.deltaY < 0 && currentScale < MAX_SCALE) {
      zoomIn(0.01, 0);
    } else if (e.deltaY > 0 && currentScale > MIN_SCALE) {
      zoomOut(0.01, 0);
    }
  }, []);

  // Prevent browser zoom and handle pinch gestures globally
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      // Trackpad pinch comes as wheel with ctrlKey
      if (e.ctrlKey) {
        e.preventDefault();
        if (!transformRef.current) return;

        const currentScale = transformRef.current.state.scale;
        const { zoomIn, zoomOut } = transformRef.current;

        if (e.deltaY < 0 && currentScale < MAX_SCALE) {
          zoomIn(0.01, 0);
        } else if (e.deltaY > 0 && currentScale > MIN_SCALE) {
          zoomOut(0.01, 0);
        }
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("wheel", handleGlobalWheel, { passive: false });
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);

    return () => {
      document.removeEventListener("wheel", handleGlobalWheel);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  // Organize comments
  const { mainComments, repliesByParentId } = useMemo(() => {
    if (!data?.data)
      return {
        mainComments: [],
        repliesByParentId: new Map<number, CommentType[]>(),
      };

    const main: CommentType[] = [];
    const replies = new Map<number, CommentType[]>();

    for (const comment of data.data) {
      if (comment.type === "comment") {
        main.push(comment);
      } else if (comment.parent_id) {
        const existing = replies.get(comment.parent_id) || [];
        existing.push(comment);
        replies.set(comment.parent_id, existing);
      }
    }

    return { mainComments: main, repliesByParentId: replies };
  }, [data?.data]);

  const toggleCommentMode = () => {
    setCommentMode(!commentMode);
  };

  const handleTransform = (ref: ReactZoomPanPinchRef) => {
    const { scale, positionX, positionY } = ref.state;
    setTransformState({ scale, positionX, positionY });
    setScale(scale);
    setPan(positionX, positionY);
  };

  const zoomPercent = Math.round(transformState.scale * 100);

  return (
    <>
      <S.Toolbar>
        <S.UserInfo>Signed in as {user?.username}</S.UserInfo>
        <S.LogoutButton onClick={logout}>Sign Out</S.LogoutButton>
      </S.Toolbar>
      <S.ZoomLevel>{zoomPercent}%</S.ZoomLevel>
      <S.HelpText>Drag to pan | Scroll to zoom</S.HelpText>
      <S.AddCommentButton onClick={toggleCommentMode} $active={commentMode}>
        <BubbleIcon color={commentMode ? "white" : "#888"} />
        <span>Add comment</span>
      </S.AddCommentButton>
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.3}
        maxScale={2.5}
        limitToBounds={false}
        centerOnInit={false}
        panning={{ disabled: commentMode, velocityDisabled: true }}
        pinch={{ step: 0.01 }}
        wheel={{ step: 0.01, smoothStep: 0.01 }}
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
          onWheel={handleWheel}
          commentMode={commentMode}
          setCommentMode={setCommentMode}
        />
      </TransformWrapper>
    </>
  );
}
