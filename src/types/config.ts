import { GraphLink } from "./graph";
import { GraphLinkDirection } from "./common";

export interface Entity {
  [index: string]: any;
  name?: string | null | undefined;
  __typename?: string | undefined;
}

export interface FontSize {
  /** Default: 12 */
  groupName?: number;
  /** Default: 7 */
  nodeLabel?: number;
  /** Default: 9 */
  nodeName?: number;
}

export interface GraphProps<R extends Entity, S extends boolean> {
  /** Default: 6 */
  arrowHeadSize?: number;
  /** CSS className to be applied to the root level svg. */
  className?: string;
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
  /**
   * If you have a field on your entities that is commonly used as the entity's name (e.g. the field `name`),
   * you can provide that here and not need to add a value for `name` on each GraphNodeConfig.
   */
  defaultNameField?: string;
  fontSize?: FontSize;
  /** Configuration settings for the different forces applied. */
  forces?: ForcesConfig;
  /**
   * A closure around a d3 color scale.
   * Label color scale must be wrapped in a closure so that
   * it's re-instantiated for each node type.
   * Default: () => scaleOrdinal(schemeTableau10)
   */
  getLabelColorScale?: () => (value: any) => string;
  /** Default: 0.6 */
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
  /** Default: 1.5 */
  labelRadius?: number;
  /**
    * A d3 color scale.
    * Default: scaleOrdinal(schemeCategory10)
    */
  nodeColorScale?: (value: any) => string;
  /** Default: 10 */
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
  /** CSS style to be applied to the root level svg. */
  style?: React.SVGAttributes<SVGElement>["style"];
  /**
   * Width value of the rendered svg.
   * Default: 700
   */
  width?: number;
}

export interface ForcesConfig {
  /** Node collision force applied to all nodes. */
  collision?: {
    /** Default: 150 */
    strength?: number;
  };
  /**
   * Node distance maintained for any nodes connected by a link.
   * Uses distance if provided, otherwise falls back to strength (or if strength is not provided,
   * the default value for strength).
   */
  link?: {
    /** Default: undefined */
    distance?: number;
    /** Default: ({ sourceDegree, targetDegree }) => 1 / (4 * Math.min(sourceDegree.out, targetDegree.out)) */
    strength?: number | ((link: GraphLink) => number);
  };
  /** Node repulsion applied to all nodes. */
  repulsion?: {
    /** Default: -280 */
    strength?: number;
    /** Default: 150 */
    distanceMax?: number;
    /** Default: undefined */
    distanceMin?: number;
  };
  /**
   * Forces applied across nodes within (and not between) each group.
   * Adhesion and repulsion are separated into different forces to
   * allow composition of a "covalent" force in which the distance
   * between nodes is pushed into an equilibrium range [minRange, maxRange].
   */
  group?: {
    adhesion?: {
      /** Default: 700 */
      strength?: number;
      /** Default: 100 */
      minRange?: number;
    };
    repulsion?: {
      /** Default: -400 */
      strength?: number;
      /** Default: 250 */
      maxRange?: number;
    };
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

/**
 * Path can be typed in one of two ways:
 * - A JMESPath query for finding nodes contained in their parent node (the `root` object is the first parent node).
 * - A general mapping querying function (No object mutations should be included here because this object will likely
 *   be evaluated by other Paths).
 */
export type Path = string | ((value: any) => any);

export interface GraphNodeConfig {
  /**
   * CSS class name(s) to be applied to this node's root level SVGGElement.
   * If className is a an object, use the values in `__typename` as your keys
   * and the CSS className you'd like to apply to that specific node with that type.
   * E.g. if I expect the objects found by `path` to have `__typename` "Airline" or "Cruiseline",
   * `className` could look like { Airline: "className1", Cruisline: "className2" }
   */
  className?: string | Record<string, string>;
  /**
   * A Path or array of Paths applied sequentially.
   * The result evaluated at the path(s) is mapped into an array as follows:
   * - no results maps to an empty array of nodes
   * - a single, non-array result is wrapped as an array of one node
   * - an array result is managed as that array of nodes
   */
  path: Path | Path[];
  /** A JMESPath query for each node to give it a name. */
  name?: Path | Path[];
  /** Corresponds to all links which should be connected to each node found from the results of the `path` query. */
  links?: GraphLinkConfig[];
  /**
   * A JMESPath query for each node to give it a label or set of labels.
   * Similar wrapping occurs for non-existent / singular / multiple label results as in the `path` query.
   */
  label?: Path | Path[];
  /**
   * CSS style(s) to be applied to this node's root level SVGGElement.
   * If className is a an object, use the values in `__typename` as your keys
   * and the CSS className you'd like to apply to that specific node with that type.
   */
  style?:
    | React.SVGAttributes<SVGGElement>["style"]
    | Record<string, React.SVGAttributes<SVGGElement>["style"]>;
}

export interface GraphLinkConfig {
  /** CSS class name to be applied to this link's root level SVGGElement. */
  className?: string;
  /**
   * Whether to draw an arrowhead on the source, target, neither or both.
   * Default: GraphLinkDirection.None
   */
  direction?: GraphLinkDirection;
  /** Non-JMESPath strings (i.e. no JSON querying involved). */
  labels?: string[];
  /** Configuration of target node set. */
  nodes: GraphNodeConfig[];
    /** CSS style to be applied to this link's root level SVGGElement. */
  style?: React.SVGAttributes<SVGGElement>["style"];
}

export interface GraphGroupConfig {
  key?: string;
  /** A normal string name (i.e. no JSON querying involved). */
  name?: string;
  /** Configurations for this group's subset of nodes. */
  nodes: GraphNodeConfig[];
}
