import { Entity, GraphLink, GraphNode, GraphNodeConfig, GraphNodeLabel, GraphLinkDirection } from "./types";
import { has } from "ramda";
import { json as jq } from "jq";

const jqArray = (json: object, path: string | undefined) => {
  if (!path) return [];
  try {
    const jqResult = jq(json, path);
    return (Array.isArray(jqResult) ? jqResult : [jqResult]).filter(Boolean);
  } catch (error) {
    console.log(json);
    throw new Error(`jq error: couldn't parse path: ${path}`);
  }
};

export const getNodesAndLinks = <R extends Entity>(idField: string, root: R, nodeConfigs: GraphNodeConfig[] = [], nodeMap: Record<string, GraphNode> = {}) => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  for (let i = 0; i < nodeConfigs.length; i += 1) {
    const { label, labels, links: linkConfigs = [], path } = nodeConfigs[i];
    const preNodes = jqArray(root, path);
    const newNodes: GraphNode[] = preNodes
      .filter(preNode => !has(preNode[idField], nodeMap))
      .map(preNode => ({
        ...preNode,
        id: preNode[idField],
        labels: jqArray(preNode, labels || label).map(e => typeof e === "string" ? e : JSON.stringify(e)),
      }));
    for (let j = 0; j < newNodes.length; j += 1) {
      const newNode = newNodes[j];
      nodeMap[newNode.id] = newNode;
      nodes.push(newNode);
    }

    if (labels || label) {
      const oldNodes = preNodes.filter(preNode => has(preNode.id, nodeMap));
      for (let j = 0; j < oldNodes.length; j += 1) {
        const oldNode = oldNodes[j];
        const newLabels = jqArray(oldNode, labels || label).map(label => ({ ...label, id: label[idField] })) as GraphNodeLabel[];
        if (!nodeMap[oldNode.id].labels) {
          nodeMap[oldNode.id].labels = newLabels;
        } else { // @ts-ignore
          nodeMap[oldNode.id].labels.push(...newLabels);
        }
      }
    }

    for (let j = 0; j < linkConfigs.length; j += 1) {
      const { direction, labels, node: nodeConfig } = linkConfigs[j];
      for (let k = 0; k < preNodes.length; k += 1) {
        const preNode = preNodes[k];
        const [subNodes, subLinks] = getNodesAndLinks(idField, preNode, [nodeConfig], nodeMap);
        links.push(...subNodes.map(subNode => ({
          labels,
          isDirected: direction !== GraphLinkDirection.None,
          source: direction === GraphLinkDirection.Out ? preNode[idField] : subNode.id,
          target: direction === GraphLinkDirection.Out ? subNode.id : preNode[idField],
        })));
        links.push(...subLinks);
        nodes.push(...subNodes);
      }
    }
  }
  return [nodes, links] as const;
};