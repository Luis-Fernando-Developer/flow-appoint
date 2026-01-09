export type NodeType =
  // bubbles
  | "bubble-text"
  | "bubble-number"
  | "bubble-image"
  | "bubble-video"
  | "bubble-audio"
  | "bubble-document"
  // inputs
  | "input-text"
  | "input-number"
  | "input-mail"
  | "input-phone"
  | "input-image"
  | "input-video"
  | "input-audio"
  | "input-document"
  | "input-buttons"
  | "input-webSite"
  // logic
  | "set-variable"
  | "script";

export interface NodeConfig {
  [key: string]: any;
}

export interface Node {
  id: string;
  type: NodeType;
  config: NodeConfig;
}

export interface Container {
  id: string;
  nodes: Node[];
  position: { x: number; y: number };
}

export interface ButtonConfig {
  id: string;
  label: string;
  value?: string;
  description?: string;
}

export interface ButtonGroupConfig {
  buttons: ButtonConfig[];
  saveVariable?: string;
  isMultipleChoice?: boolean;
  isSearchable?: boolean;
  submitLabel?: string;
}

export interface Edge {
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface Workspace {
  name: string;
  containers: Container[];
  edges?: Edge[];
}
