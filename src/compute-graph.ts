import {
  Entity,
  GraphGroup,
  GraphGroupConfig,
  GraphLink,
  GraphNode,
  GraphNodeConfig,
  GraphLinkDirection,
  Path,
} from "./types";
import { concat, has, lensProp, mergeDeepWith, uniqBy, unnest, view } from "ramda";
import { search } from "jmespath";

export const rootJMESPath = ".";

export type Config<R extends Entity> = {
  defaultNameField?: string;
  height: number;
  idField: string;
  nodeRadius: number;
  resolveEntities: boolean;
  root: R;
  showRoot: boolean;
  width: number;
};

export const computeGraph = async <R>({
  config,
  defaultNameField,
  height,
  idField,
  nodeRadius,
  resolveEntities,
  root,
  showRoot,
  width,
}: Config<R> & { config: GraphGroupConfig[] }) => {
  const groups = new Array<GraphGroup>(config.length).fill({ key: "", name: "", size: 0 });
  const allLinks = new Array(config.length).fill(null);
  const allNodes = new Array(config.length).fill(null);
  for (let i = 0; i < config.length; i += 1) {
    const { key: preKey, name, nodes: nodeConfigs } = config[i];
    const key = preKey || `${i}-name-${name || ""}`;
    const [nodes, links] = getNodesAndLinks({ defaultNameField, idField, nodeConfigs, nodeRadius, root });
    groups[i] = { key, name: name || "", size: nodes.length };
    allLinks[i] = links;
    allNodes[i] = nodes.map(({ labels, ...rest }) => ({
      ...rest,
      group: key,
      labels: uniqBy(view(lensProp("id")), labels || []),
    })) as GraphNode[];
  }
  let nodes = unnest(allNodes);
  if (showRoot || resolveEntities) {
    const nodeSet = new Map<string, GraphNode>();
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!nodeSet.has(node.id)) {
        nodeSet.set(node.id, node);
      } else {
        nodeSet.set(node.id, deepMerge(nodeSet.get(node.id), node));
      }
    }
    nodes = Array.from(nodeSet.values());
  }
  return {
    groups,
    links: unnest(allLinks) as GraphLink[],
    nodes: nodes.map((node, i) => ({
      ...node,
      // TODO: Initialize clusters using a quadtree to avoid initial collisions
    })) as GraphNode[],
  };
};

type GetNodesAndLinksConfig<R extends Entity> = {
  defaultNameField?: string;
  idField: string;
  root: R;
  nodeConfigs?: GraphNodeConfig[];
  nodeMap?: Record<string, GraphNode>;
  nodeRadius: number;
};

const getNodesAndLinks = <R extends Entity>({
  defaultNameField,
  idField,
  nodeConfigs = [],
  nodeMap = {},
  nodeRadius,
  root,
}: GetNodesAndLinksConfig<R>) => {
  const nodes: GraphNode[] = [];
  const allNodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  for (let i = 0; i < nodeConfigs.length; i += 1) {
    const nodeConfig = nodeConfigs[i];
    const { className, links: linkConfigs = [], path, label, name, style } = nodeConfig;
    const pathPaths = Array.isArray(path) ? path : [path];
    const labelPaths = !label || Array.isArray(label) ? label : [label];
    let namePaths: Path[] | undefined;
    if (!name) {
      namePaths = defaultNameField ? [defaultNameField] : undefined;
    } else {
      namePaths = Array.isArray(name) ? name : [name];
    }

    const preNodes = path === rootJMESPath ? [root] : findArray<R>(root, pathPaths);
    let newNodes: GraphNode[] = preNodes.map(preNode => {
      const labels = !labelPaths ? [] : findArray(preNode, labelPaths as Path[]).map(e => {
        const value = typeof e === "string" ? e : JSON.stringify(e);
        return {
          __typename: preNode.__typename,
          id: value,
          value,
        };
      });
      if (has(preNode.id, nodeMap)) {
        nodeMap[preNode.id].labels.push(...labels);
      }
      return {
        ...preNode,
        className,
        labels,
        style,
        id: preNode[idField],
        degree: { in: 0, out: 0 },
        name: findValue(preNode, namePaths as Path[], "", "string"),
        radius: nodeRadius,
      };
    });
    nodes.push(...newNodes);
    newNodes = newNodes.filter(preNode => !has(preNode[idField], nodeMap))
    for (let j = 0; j < newNodes.length; j += 1) {
      const newNode = newNodes[j];
      nodeMap[newNode.id] = newNode;
      allNodes.push(newNode);
      nodes.push(newNode);
    }

    for (let j = 0; j < linkConfigs.length; j += 1) {
      const { className, direction = GraphLinkDirection.None, labels = [], nodes: nodeConfigs, style } = linkConfigs[j];
      for (let k = 0; k < preNodes.length; k += 1) {
        const preNode = preNodes[k];
        const [descendentNodes, subLinks, childrenNodes] = getNodesAndLinks({
          defaultNameField,
          idField,
          nodeRadius,
          nodeMap,
          nodeConfigs,
          root: preNode,
        });
        const parentNode = nodeMap[preNode[idField]];
        links.push(...childrenNodes.map(childNode => {
          const { sourceNode, targetNode } = getSourceAndTarget(parentNode, childNode, direction);
          sourceNode.degree.out += 1;
          targetNode.degree.in += 1;
          if (direction === GraphLinkDirection.Both || direction === GraphLinkDirection.None) {
            sourceNode.degree.in += 1;
            targetNode.degree.out += 1;
          }
          return {
            className,
            direction,
            labels,
            style,
            source: sourceNode.id,
            sourceDegree: sourceNode.degree,
            target: targetNode.id,
            targetDegree: targetNode.degree,
          };
        }));
        links.push(...subLinks);
        allNodes.push(...descendentNodes);
      }
    }
  }
  return [allNodes, links, nodes] as const;
};

const getSourceAndTarget = (parentNode: GraphNode, childNode: GraphNode, direction: GraphLinkDirection) =>
  direction === GraphLinkDirection.Out
    ? { sourceNode: parentNode, targetNode: childNode }
    : { sourceNode: childNode, targetNode: parentNode };

const deepMerge = mergeDeepWith((a, b) => Array.isArray(a) && Array.isArray(b) ? concat(a, b) : b);

const find = <T = any>(data: object, path: Path, fallback?: T): T | undefined => {
  if (!data || !path) return fallback;
  let jqResult: T;
  if (typeof path === "string") {
    try {
      jqResult = search(data, path);
    } catch (error) {
      throw new Error(`Path error: couldn't parse JMESPath path: ${path}`);
    }
  } else {
    try {
      jqResult = path(data);
    } catch (error) {
      throw new Error(`Path error: couldn't operate path fn`);
    }
  }
  return jqResult;
};

const findArray = <T>(data: object, paths: Path[]): T[] => {
  let result = [data].filter(Boolean);
  for (let i = 0; i < paths.length; i += 1) {
    if (result === undefined) return [];
    const path = paths[i];
    result = unnest(result.map(result => {
      const newResult = find(result, path);
      return !Array.isArray(newResult) ? [newResult] : newResult;
    })).filter(Boolean);
  }
  return result as unknown as T[];
};

const findValue = <T = any>(data: object, paths: Path[], fallback: T, type: string) => {
  let result = data as any;
  for (let i = 0; i < paths.length; i += 1) {
    result = find(result, paths[i]);
  }
  if (typeof result === type) {
    return result as T;
  }
  return fallback;
};
