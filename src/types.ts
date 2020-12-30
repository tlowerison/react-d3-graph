export interface Entity {
  [index: string]: any;
  name?: string | null | undefined;
  __typename?: string | undefined;
}

export interface GraphNode {
  [index: string]: any;
  id: any;
  name: string;
  labels?: GraphNodeLabel[];
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
  isDirected: boolean;
  source: any;
  target: any;
}

export enum GraphLinkDirection {
  In,
  None,
  Out,
}

export interface GraphNodeConfig {
  path: string;
  label?: string;
  labels?: string;
  links?: {
    direction: GraphLinkDirection;
    label?: string;
    labels?: string[];
    node: GraphNodeConfig;
  }[];
}

export interface GraphGroupConfig {
  key?: string;
  label?: string;
  nodes: GraphNodeConfig[];
};

export interface GraphProps<R extends Entity> {
  arrowHeadSize?: number;
  collisionStrength?: number;
  clusterRepulsion?: number;
  fontSize?: number;
  forces?: {
    collision?: {
      strength?: number;
    };
    link?: {
      distance?: number;
    };
    repulsion?: {
      distanceMax?: number;
      distanceMin?: number;
      strength?: number;
    };
    subClusterAdhesion?: {
      minRangeRatio?: number;
      strength?: number;
    };
    subClusterRepulsion?: {
      maxRangeRatio?: number;
      strength?: number;
    };
  };
  getLabelColorScale?: () => (value: any) => string;
  groups: GraphGroupConfig[];
  groupLabelOpacity?: number;
  height?: number;
  idField: string;
  labelFontSize?: number;
  labelRadius?: number;
  linkDistance?: number;
  nodeColorScale?: (value: any) => string;
  nodeRadius?: number;
  root: R;
  width?: number;
}
