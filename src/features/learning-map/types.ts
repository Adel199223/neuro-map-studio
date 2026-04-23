export type NodeGroup = 'blue' | 'green' | 'amber' | 'rose' | 'violet';
export type NodeShape = 'card' | 'round' | 'oval' | 'pill' | 'note';
export type LearningNodeType = 'concept' | 'question' | 'evidence' | 'document';
export type Importance = 1 | 2 | 3 | 4 | 5;
export type PortSide = 'auto' | 'top' | 'right' | 'bottom' | 'left';
export type LinkRoute = 'straight' | 'curve' | 'elbow' | 'arc';
export type RelationshipType =
  | 'causes'
  | 'funds'
  | 'controls'
  | 'benefits'
  | 'costs'
  | 'loop'
  | 'exit'
  | 'evidence'
  | 'contrast'
  | 'custom';

export interface LearningNode {
  id: string;
  title: string;
  body: string;
  group: NodeGroup;
  shape: NodeShape;
  importance: Importance;
  x: number;
  y: number;
  w: number;
  h: number;
  tag?: string;
  nodeType?: LearningNodeType;
  documentId?: string;
}

export interface LearningEdge {
  id: string;
  from: string;
  to: string;
  relation: RelationshipType;
  strength: Importance;
  shape: LinkRoute;
  label?: string;
  fromPort?: PortSide;
  toPort?: PortSide;
}

export interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export interface LearningMap {
  version: number;
  view: ViewState;
  nodes: LearningNode[];
  edges: LearningEdge[];
}

export interface LearningPage {
  id: string;
  title: string;
  map: LearningMap;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningWorkspace {
  schemaVersion: 1;
  activePageId: string;
  pages: LearningPage[];
}
