import { Entity, GraphConfig, GraphGroup, GraphLink, GraphNode } from "./types";
import { Config, computeGraph, rootJMESPath } from "./compute-graph";
import { useEffect, useState } from "react";

export interface Graph {
  groups: GraphGroup[];
  links: GraphLink[];
  nodes: GraphNode[];
}

export const useGraph = <R extends Entity, S extends boolean>({
  config,
  showRoot,
  ...restConfig
}: Config<R> & { config: GraphConfig<S> }) => {
  const [graph, setGraph] = useState<Graph>({ groups: [], links: [], nodes: [] });
  useEffect(
    () => {
      (async () => {
        if (!showRoot && Array.isArray(config)) {
          setGraph(await computeGraph({ ...restConfig, config, showRoot }));
        } else {
          setGraph(await computeGraph({
            ...restConfig,
            showRoot,
            config: [{ nodes: [{ ...config, path: rootJMESPath }] }],
          }));
        }
      })();
    },
    [config, restConfig.root],
  );
  return graph;
};
