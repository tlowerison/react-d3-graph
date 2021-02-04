import { GraphLinkDirection } from "./config";

export interface GraphGroup {
  key: string;
  label: string;
  size: number;
}

export interface GraphNode {
  [index: string]: any;
  id: any;
  name: string;
  labels?: GraphNodeLabel[];
  radius: number;
  __typename?: string | undefined;
}

export interface GraphNodeLabel {
  [index: string]: any;
  id: any;
  value: string;
  __typename?: string | undefined;
}

export interface GraphLink {
  labels?: string[];
  direction: GraphLinkDirection;
  source: any;
  target: any;
}

export interface Forces {
  collision: {
    strength: number;
  };
  link: {
    distance: number;
  };
  repulsion: {
    distanceMax?: number;
    distanceMin?: number;
    strength: number;
  };
  subClusterAdhesion: {
    minRangeRatio: number;
    strength: number;
  };
  subClusterRepulsion: {
    maxRangeRatio: number;
    strength: number;
  };
}
