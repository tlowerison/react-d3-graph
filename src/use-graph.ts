import { Entity, GraphLink, GraphNode, GraphProps } from "./types";
import { getNodesAndLinks } from "./get-nodes-and-links";
import { lensProp, uniqBy, unnest, view } from "ramda";
import { useMemo } from "react";

const toRandCoord = ({ x, y }: { x: number; y: number }, maxRadius: number) => () => {
  const radius = maxRadius * Math.random();
  const angle = 2 * Math.PI * Math.random();
  return {
    x: x + radius * Math.cos(angle),
    y: y + radius * Math.sin(angle),
  };
};

export const useGraph = <R extends Entity>({
  height,
  idField,
  root,
  groups: groupConfigs = [],
  linkDistance,
  width,
}: Pick<Required<GraphProps<R>>, "groups" | "height" | "idField" | "linkDistance" | "root" | "width">) => useMemo(
  () => {
    const groups = new Array(groupConfigs.length).fill(null);
    const allLinks = new Array(groupConfigs.length).fill(null);
    const allNodes = new Array(groupConfigs.length).fill(null);
    for (let i = 0; i < groupConfigs.length; i += 1) {
      const { key: preKey, label, nodes: nodeConfigs } = groupConfigs[i];
      const key = preKey || `${i}-label-${label || ""}`;
      const [nodes, links] = getNodesAndLinks(idField, root, nodeConfigs);
      // TODO (tlowerison): Initialize clusters using a quadtree to avoid initial collisions
      let x = 0;
      let y = 0;
      if (groupConfigs.length > 1) {
        x = width / 2 * (Math.random() - 1/2);
        y = height / 2 * (Math.random() - 1/2);
      }
      const randCoord = toRandCoord({ x, y }, linkDistance * Math.sqrt(nodes.length - 1))
      groups[i] = { key, label, size: nodes.length };
      allLinks[i] = links;
      allNodes[i] = nodes.map(({ labels, ...rest }) => ({
        ...rest,
        ...randCoord(),
        group: key,
        labels: uniqBy(view(lensProp("id")), labels || []),
      })) as GraphNode[];
    }
    return { groups, links: unnest(allLinks) as GraphLink[], nodes: unnest(allNodes) as GraphNode[] };
  },
  [groupConfigs, root],
);
