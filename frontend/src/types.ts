export type ToolMode = 'select' | 'rect' | 'freehand' | 'eraser';

export interface RectData {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FreehandData {
  points: Array<[number, number]>;
}

export interface Annotation {
  id: string;
  pageNum: number;
  type: 'rect' | 'freehand';
  data: RectData | FreehandData;
  color: string;
  author: string;
  createdAt: number;
  resolved: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface AwarenessState {
  user: { name: string; color: string };
  cursor?: { pageNum: number; x: number; y: number } | null;
}
