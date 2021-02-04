import {
  Entity,
  GraphGroup,
  GraphGroupConfig,
  GraphLink,
  GraphNode,
  GraphNodeConfig,
  GraphNodeLabel,
  GraphLinkDirection,
} from "./types";
import { concat, has, identity, lensProp, mergeDeepWith, uniqBy, unnest, view } from "ramda";
import { search } from "jmespath";

export const rootJMESPath = ".";

export type Config<R extends Entity> = {
  height: number;
  idField: string;
  linkDistance: number;
  nodeRadius: number;
  resolveEntities: boolean;
  root: R;
  showRoot: boolean;
  width: number;
};

export const computeGraph = async <R>({
  config,
  height,
  idField,
  linkDistance,
  nodeRadius,
  resolveEntities,
  root,
  showRoot,
  width,
}: Config<R> & { config: GraphGroupConfig[] }) => {
  const groups = new Array<GraphGroup>(config.length).fill({ key: "", label: "", size: 0 });
  const allLinks = new Array(config.length).fill(null);
  const allNodes = new Array(config.length).fill(null);
  for (let i = 0; i < config.length; i += 1) {
    const { key: preKey, label, nodes: nodeConfigs } = config[i];
    const key = preKey || `${i}-label-${label || ""}`;
    const [nodes, links] = getNodesAndLinks({ idField, nodeConfigs, nodeRadius, root });
    // TODO: Initialize clusters using a quadtree to avoid initial collisions
    let x = 0;
    let y = 0;
    if (config.length > 1) {
      x = width / 2 * (Math.random() - 1/2);
      y = height / 2 * (Math.random() - 1/2);
    }
    const randCoord = toRandCoord({ x, y }, linkDistance * Math.sqrt(nodes.length - 1))
    groups[i] = { key, label: label || "", size: nodes.length };
    allLinks[i] = links;
    allNodes[i] = nodes.map(({ labels, ...rest }) => ({
      ...rest,
      ...randCoord(),
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
  return { groups, links: unnest(allLinks) as GraphLink[], nodes: unnest(allNodes) as GraphNode[] };
};

type GetNodesAndLinksConfig<R extends Entity> = {
  idField: string;
  root: R;
  nodeConfigs?: GraphNodeConfig[];
  nodeMap?: Record<string, GraphNode>;
  nodeRadius: number;
};

const getNodesAndLinks = <R extends Entity>({
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
    const { links: linkConfigs = [], radius } = nodeConfig;

    const [path, processPath] = typeof nodeConfig.path === "string"
      ? [nodeConfig.path, identity]
      : nodeConfig.path;

    const [name, processName] = typeof nodeConfig.name === "string" || !nodeConfig.name
      ? [nodeConfig.name || "name", identity]
      : nodeConfig.name;

    const [labels, processLabels] = typeof nodeConfig.labels === "string" || !nodeConfig.labels
      ? [nodeConfig.labels, identity]
      : nodeConfig.labels;

    const preNodes = path === rootJMESPath ? [root] : findArray(root, path).map(processPath);
    const newNodes: GraphNode[] = preNodes
      .filter(preNode => !has(preNode[idField], nodeMap))
      .map(preNode => ({
        ...preNode,
        id: preNode[idField],
        labels: processLabels(findArray(preNode, labels).map(e => typeof e === "string" ? e : JSON.stringify(e))),
        name: processName(search(preNode, name)),
        radius: !radius ? nodeRadius : findNumber(preNode, radius, "node.radius", nodeRadius),
      }));
    for (let j = 0; j < newNodes.length; j += 1) {
      const newNode = newNodes[j];
      nodeMap[newNode.id] = newNode;
      allNodes.push(newNode);
      nodes.push(newNode);
    }

    if (labels) {
      const oldNodes = preNodes.filter(preNode => has(preNode.id, nodeMap));
      for (let j = 0; j < oldNodes.length; j += 1) {
        const oldNode = oldNodes[j];
        const newLabels = findArray(oldNode, labels).map(label => ({ ...label, id: label[idField] })) as GraphNodeLabel[];
        if (!nodeMap[oldNode.id].labels) {
          nodeMap[oldNode.id].labels = newLabels;
        } else { // @ts-ignore
          nodeMap[oldNode.id].labels.push(...newLabels);
        }
      }
    }

    for (let j = 0; j < linkConfigs.length; j += 1) {
      const { direction = GraphLinkDirection.None, labels, node: nodeConfig } = linkConfigs[j];
      for (let k = 0; k < preNodes.length; k += 1) {
        const preNode = preNodes[k];
        const [descendentNodes, subLinks, childrenNodes] = getNodesAndLinks({
          idField,
          nodeRadius,
          nodeMap,
          nodeConfigs: [nodeConfig],
          root: preNode,
        });
        links.push(...childrenNodes.map(childNode => ({
          labels,
          direction,
          source: direction === GraphLinkDirection.Out ? preNode[idField] : childNode.id,
          target: direction === GraphLinkDirection.Out ? childNode.id : preNode[idField],
        })));
        links.push(...subLinks);
        allNodes.push(...descendentNodes);
      }
    }
  }
  return [allNodes, links, nodes] as const;
};

const deepMerge = mergeDeepWith((a, b) => Array.isArray(a) && Array.isArray(b) ? concat(a, b) : b);

const findArray = (data: object, path: string | undefined) => {
  if (!path) return [];
  try {
    let jqResult = search(data, path);
    if (!Array.isArray(jqResult)) {
      jqResult = [jqResult];
    }
    return jqResult.filter((value: any) => value !== undefined && value !== null);
  } catch (error) {
    throw new Error(`JMESPath error: couldn't parse path: ${path}`);
  }
};

const findNumber = (data: object, path: string | undefined, fieldName: string, fallback: number) => {
  if (!path) return fallback;
  try {
    let jqResult = search(data, path);
    if (typeof jqResult !== "number") {
      console.warn(`JMESPath warning: path "${path}" returned a non-number result for ${fieldName}, falling back to ${fallback}`);
    }
  } catch (error) {
    throw new Error(`JMESpath error: couldn't parse path: "${path}"`);
  }
};

const toRandCoord = ({ x, y }: { x: number; y: number }, maxRadius: number) => () => {
  const radius = maxRadius * Math.random();
  const angle = 2 * Math.PI * Math.random();
  return {
    x: x + radius * Math.cos(angle),
    y: y + radius * Math.sin(angle),
  };
};
