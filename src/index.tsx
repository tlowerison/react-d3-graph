import "regenerator-runtime/runtime.js";
import React, { useEffect, useMemo, useRef } from "react";
import { Entity, Forces, GraphLinkDirection, GraphProps } from "./types";
import { Group } from "./group";
import { Link } from "./link";
import { Node } from "./node";
import { computeSimulation } from "./compute-simulation";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10, schemeTableau10 } from "d3-scale-chromatic";
import { select } from "d3-selection";
import { fromPairs, uniq, unnest } from "ramda";
import { useGraph } from "./use-graph";

export * from "./types/config";
export * from "./use-graph";

const defaultGetLabelColorScale = () => scaleOrdinal(schemeTableau10);
const defaultNodeColorScale = scaleOrdinal(schemeCategory10);
const defaultFontSize = {
  groupName: 12,
  nodeLabel: 7,
  nodeName: 9,
};

export const Graph = <R extends Entity, S extends boolean>({
  arrowHeadSize = 6,
  config,
  fontSize: fontSizeConfig = defaultFontSize,
  forces: forceConfigs = {},
  getLabelColorScale = defaultGetLabelColorScale,
  groupLabelOpacity = 0.6,
  height = 300,
  idField,
  labelRadius = 1.5,
  nodeColorScale = defaultNodeColorScale,
  nodeRadius = 10,
  root,
  resolveEntities,
  showRoot,
  width = 700,
}: GraphProps<R, S>) => {
  const fontSize = { ...defaultFontSize, ...fontSizeConfig };
  const svgRef = useRef<SVGSVGElement>(null);

  const forces: Forces = useMemo(() => ({
    collision: {
      strength: 150,
      ...forceConfigs.collision,
    },
    link: {
      distance: 75,
      ...forceConfigs.link,
    },
    repulsion: {
      strength: -600,
      ...forceConfigs.repulsion,
    },
    subClusterAdhesion: {
      minRangeRatio: 16,
      strength: 700,
      ...forceConfigs.subClusterAdhesion,
    },
    subClusterRepulsion: {
      maxRangeRatio: 3,
      strength: -50,
      ...forceConfigs.subClusterRepulsion,
    },
  }), [forceConfigs]);

  const { groups, links, nodes } = useGraph({
    config,
    height,
    idField,
    linkDistance: forces.link.distance,
    nodeRadius,
    root,
    resolveEntities: Boolean(resolveEntities),
    showRoot: Boolean(showRoot),
    width,
  });

  const labelScales = useMemo(
    () => fromPairs(
      uniq(unnest(nodes.map(({ labels }) => labels || [])).map(({ __typename }) => __typename || ""))
        .map(typename => [typename, getLabelColorScale()])
    ),
    [getLabelColorScale, groups],
  );

  useEffect(
    () => {
      const svg = svgRef.current;
      if (svg) {
        const a = 5 / 6 * arrowHeadSize;
        const b = 2 * a;
        select(svg).append("defs").selectAll("marker")
          .data(["suit"])
          .enter().append("marker")
            .attr("id", function(d) { return d; })
            .attr("viewBox", `0 -${a} ${b} ${b}`)
            .attr("refX", 5 * a)
            .attr("refY", 0)
            .attr("markerWidth", arrowHeadSize)
            .attr("markerHeight", arrowHeadSize)
            .attr("orient", "auto")
          .append("path")
            .attr("d", `M0,-${a}L${b},0L0,${a} L${b},0 L0, -${a}`)
            .style("stroke", "#4679BD")
            .style("opacity", "0.6");
      }
    },
    [svgRef],
  );

  useEffect(
    () => {
      (async () => {
        const svg = svgRef.current;
        if (svg) {
          computeSimulation({ forces, groups, links, nodes, nodeRadius, svg });
        }
      })();
    },
    [forces, groups, links, nodes, nodeRadius, svgRef],
  );

  return (
    <svg ref={svgRef} viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}>
      <g>
        {links.map(({ direction, ...link }) => direction === GraphLinkDirection.Both ? (
          <>
            <Link markerEnd {...link} />
            <Link markerEnd {...link} source={link.target} target={link.source} />
          </>
        ) : (
          <Link markerEnd={direction !== GraphLinkDirection.None} {...link} />
        ))}
      </g>
      <g>
        {nodes.map(node => (
          <Node
            labelFontSize={fontSize.nodeLabel}
            labelRadius={labelRadius}
            labelScales={labelScales}
            nameFontSize={fontSize.nodeName}
            nodeColorScale={nodeColorScale}
            {...node}
          />
        ))}
        {groups.map(({ key, label, size }, i) => size === 0 ? null : (
          <Group
            key={key || `${i}-label-${label || ""}`}
            fontSize={fontSize.groupName}
            groupLabelOpacity={groupLabelOpacity}
            label={label}
          />
        ))}
      </g>
    </svg>
  );
};
