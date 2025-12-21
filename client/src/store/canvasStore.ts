import { create } from 'zustand';

interface CanvasState {
  panX: number;
  panY: number;
  scale: number;
  selectedCommentId: number | null;
  editingCommentId: number | null;
  newCommentPosition: { x: number; y: number } | null;
  commentMode: boolean;
  setPan: (x: number, y: number) => void;
  setScale: (scale: number) => void;
  selectComment: (id: number | null) => void;
  setEditingComment: (id: number | null) => void;
  setNewCommentPosition: (pos: { x: number; y: number } | null) => void;
  setCommentMode: (active: boolean) => void;
  resetView: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  panX: 0,
  panY: 0,
  scale: 1,
  selectedCommentId: null,
  editingCommentId: null,
  newCommentPosition: null,
  commentMode: false,
  setPan: (x, y) => set({ panX: x, panY: y }),
  setScale: (scale) => set({ scale: Math.max(0.1, Math.min(3, scale)) }),
  selectComment: (id) => set({ selectedCommentId: id }),
  setEditingComment: (id) => set({ editingCommentId: id }),
  setNewCommentPosition: (pos) => set({ newCommentPosition: pos }),
  setCommentMode: (active) => set({ commentMode: active }),
  resetView: () => set({ panX: 0, panY: 0, scale: 1 }),
}));
