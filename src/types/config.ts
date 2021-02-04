export interface Entity {
  [index: string]: any;
  name?: string | null | undefined;
  __typename?: string | undefined;
}

export interface FontSize {
  /* Default: 12 */
  groupName?: number;
  /* Default: 7 */
  nodeLabel?: number;
  /* Default: 9 */
  nodeName?: number;
}

export interface GraphProps<R extends Entity, S extends boolean> {
  /* Default: 6 */
  arrowHeadSize?: number;
  /**
   * Most important prop, the configuration describing how to search the
   * root object for nodes, links (and optionally groups).
   * If `showRoot` is true, should be a GraphNodeConfig (where path is ommitted
   * since this config will be applied to the root object).
   * If `showRoot` is false, should be an array of GraphGroupConfigs.
   * By leaving `showRoot` false, a disconnected graph will be drawn with connected
   * components corresponding 1:1 with the provided GraphGroupConfigs. By setting
   * `showRoot` true, the graph will be a single connected component.
   */
  config: GraphConfig<S>;
  fontSize?: FontSize;
  /* Configuration settings for the different forces applied. */
  forces?: ForcesConfig;
  /**
   * A closure around a d3 color scale.
   * Label color scale must be wrapped in a closure so that
   * it's re-instantiated for each node type.
   * Default: () => scaleOrdinal(schemeTableau10)
   */
  getLabelColorScale?: () => (value: any) => string;
  /* Default: 0.6 */
  groupLabelOpacity?: number;
  /**
   * Height value of the rendered svg.
   * Default: 300
   */
  height?: number;
  /**
   * The id field of each node.
   * As of now, support is only provided for a single idField across all node types.
   */
  idField: string;
  /* Default: 1.5 */
  labelRadius?: number;
  /**
    * A d3 color scale.
    * Default: scaleOrdinal(schemeCategory10)
    */
  nodeColorScale?: (value: any) => string;
  /* Default: 10 */
  nodeRadius?: number;
  /**
   * Resolve entities to the same node if they have equivalent ids
   * determined by `idField`. If `showRoot` is true, this is
   * automatically set to true.
   * Default: false
   */
  resolveEntities?: boolean;
  /**
   * Root object to perform querying on.
   */
  root: R;
  /**
   * Should a node be drawn for the root object.
   * If true,
   * Default: false
   */
  showRoot?: S;
  /**
   * Width value of the rendered svg.
   * Default: 700
   */
  width?: number;
}

export interface ForcesConfig {
  /* Node collision force applied to all nodes. */
  collision?: {
    /* Default: 150 */
    strength?: number;
  };
  /* Node distance maintained for any nodes connected by a link. */
  link?: {
    /* Default: 75 */
    distance?: number;
  };
  /* Node repulsion applied to all nodes. */
  repulsion?: {
    /* Default: undefined */
    distanceMax?: number;
    /* Default: undefined */
    distanceMin?: number;
    /* Default: -600 */
    strength?: number;
  };
  /* Node attraction applied to all nodes in each group, and not across any group. */
  subClusterAdhesion?: {
    /* Default: 16 */
    minRangeRatio?: number;
    /* Default: 700 */
    strength?: number;
  };
  /* Node repulsion applied to all nodes in each group, and not across any group. */
  subClusterRepulsion?: {
    /* Default: 3 */
    maxRangeRatio?: number;
    /* Default: -50 */
    strength?: number;
  };
}

/** The main configuration describing how to search the
 * root object for nodes, links (and optionally groups).
 * If `showRoot` is true, should be a GraphNodeConfig (where path is ommitted
 * since this config will be applied to the root object).
 * If `showRoot` is false, should be an array of GraphGroupConfigs.
 * By leaving `showRoot` false, a disconnected graph will be drawn with connected
 * components corresponding 1:1 with the provided GraphGroupConfigs. By setting
 * `showRoot` true, the graph will effectively be a tree.
 */
export type GraphConfig<S extends boolean> = S extends true ? GraphConfigShowResult : GraphGroupConfig[];
export type GraphConfigShowResult = Omit<GraphNodeConfig, "path">;

export interface GraphNodeConfig {
  /**
   * A JMESPath query for finding nodes contained in their parent node (the `root` object is the first parent node).
   * A path with:
   * - no results maps to an empty array of nodes
   * - a single, non-array result is wrapped as an array of one node
   * - an array result is managed as that array of nodes
   */
  path: string | [string, (value: any) => any];
  /**
   * A JMESPath query for each node to give it a name.
   * Default: "name"
   */
  name?: string | [string, (value: string) => string];
  /**
   * A JMESPath query for each node to give it a label or set of labels.
   * Similar wrapping occurs for non-existent / singular / multiple label results as in the `path` query.
   */
  labels?: string | [string, (value: string) => string];
  /**
   * A JMESPath query for each node to evaluate the svg radius size of the node.
   * If not supplied or a non-number result is found, falls back to `GraphProps.nodeRadius`.
   * This feature isn't yet supported.
   */
   // radius?: string;
   radius?: undefined;
  /**
   * Corresponds to all links which should be connected to each node found from the results of the `path` query.
   */
  links?: GraphLinkConfig[];
}

export enum GraphLinkDirection {
  Both,
  In,
  None,
  Out,
}

export interface GraphLinkConfig {
  /**
   * Whether to draw an arrowhead on the source, target, neither or both.
   * Default: GraphLinkDirection.None
   */
  direction?: GraphLinkDirection;
  /**
   * Same format as `GraphNodeConfig.labels`. Labels are drawn along each link.
   */
  labels?: string[];
  /**
   * Configuration of target node set.
   */
  node: GraphNodeConfig;
}

export interface GraphGroupConfig {
  key?: string;
  /**
   * A normal string label (i.e. not a JMESPath to be evaluated).
   */
  label?: string;
  /**
   * Configurations for this group's subset of nodes.
   */
  nodes: GraphNodeConfig[];
}
