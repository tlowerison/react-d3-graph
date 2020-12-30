import React, { useCallback, useEffect, useMemo, useRef } from "react";
import styles from "./styles.module.scss";
import { Entity, GraphNode, GraphProps } from "./types";
import { Link } from "react-router-dom";
import { drag } from "d3-drag";
import {
  forceCollide,
  forceLink,
  forceX,
  forceY,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10, schemeTableau10 } from "d3-scale-chromatic";
import { select } from "d3-selection";
import { fromPairs, groupBy, lensProp, mapObjIndexed, reverse, uniq, unnest, view } from "ramda";
import { polygonCentroid } from "./polygon";
import { useGraph } from "./use-graph";

export * from "./types";
export * from "./use-graph";
export * from "./get-nodes-and-links";

const defaultGetLabelColorScale = () => scaleOrdinal(schemeTableau10);
const defaultNodeColorScale = scaleOrdinal(schemeCategory10);
const simulation = forceSimulation();
export const toLinkTypename = (__typename: string | undefined) => __typename ? `${__typename.toLowerCase()}s` : "";

export const Graph = <R extends Entity>({
  arrowHeadSize = 6,
  fontSize = 9,
  forces: forceConfigs = {},
  getLabelColorScale = defaultGetLabelColorScale,
  groups: groupConfigs,
  groupLabelOpacity = 0.6,
  height = 300,
  idField,
  labelFontSize = 7,
  labelRadius = 1.5,
  nodeColorScale = defaultNodeColorScale,
  nodeRadius = 10,
  root,
  width = 700,
}: GraphProps<R>) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const forces = useMemo(() => ({
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

  const { groups, links, nodes } = useGraph({ groups: groupConfigs, height, idField, linkDistance: forces.link.distance, root, width });
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
      return () => {
        simulation.alphaTarget(0.5).restart();
      };
    },
    [],
  );

  const dragSubject = useCallback((event: any) => simulation.find(event.x , event.y), [simulation]);
  const onDragStart = useCallback((event: any) => {
    if (!event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }, [simulation]);
  const onDrag = useCallback((event: any) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }, []);
  const onDragEnd = useCallback((event: any) => {
    if (!event.active) {
      simulation.alphaTarget(0);
    }
    event.subject.fx = null;
    event.subject.fy = null;
  }, [simulation]);

  useEffect(
    () => {
      const svg = svgRef.current;
      if (svg) {
        const groupsSelection = select(svg).selectAll(".group").data(groups);
        const nodesSelection = select(svg).selectAll(".node").data(nodes);
        const linksSelection = select(svg).selectAll(".link").data(links);

        const quarterNodeRadius = nodeRadius / 4;

        // @ts-ignore
        simulation.nodes(nodes).on("tick", () => {
          linksSelection // @ts-ignore
            .attr("x1", ({ source }) => source.x) // @ts-ignore
            .attr("y1", ({ source }) => source.y) // @ts-ignore
            .attr("x2", ({ target }) => target.x) // @ts-ignore
            .attr("y2", ({ target }) => target.y) // @ts-ignore
          nodesSelection.attr("transform", ({ x, y }) => `translate(${x},${y})`);

          const centroids = mapObjIndexed(
            (nodes: GraphNode[]) => {
              const [x, y] = polygonCentroid(nodes.map(({ x, y }) => [x, y]));
              return `translate(${x},${y+quarterNodeRadius})`;
            }, // @ts-ignore
            groupBy(view(lensProp("group")), nodesSelection.data()),
          ); // @ts-ignore
          groupsSelection.attr("transform", ({ key }) => centroids[key]);
        });

        nodesSelection.call( // @ts-ignore
          drag()
            .subject(dragSubject)
            .on("start", onDragStart)
            .on("drag", onDrag)
            .on("end", onDragEnd)
        );

        const linkForce = forceLink(links)
          .id(view(lensProp("id")))
          .distance(forces.link.distance)

        const collisionForce = forceCollide()
          .strength(forces.collision.strength)

        let repulsionForce = forceManyBody()
          .strength(forces.repulsion.strength)
        if (forces.repulsion.distanceMax) {
          repulsionForce = repulsionForce.distanceMax(forces.repulsion.distanceMax);
        }
        if (forces.repulsion.distanceMin) {
          repulsionForce = repulsionForce.distanceMin(forces.repulsion.distanceMin);
        }

        simulation // @ts-ignore
          .force("link", linkForce)
          .force("collision", collisionForce)
          .force("repulsion", repulsionForce)
          .force("x", forceX())
          .force("y", forceY())

        for (let i = 0; i < groups.length; i += 1) {
          const { key } = groups[i];
          const adhesion = forceManyBody()
            .strength(forces.subClusterAdhesion.strength)
            .distanceMin(forces.subClusterAdhesion.minRangeRatio * nodeRadius)
          const repulsion = forceManyBody()
            .strength(forces.subClusterRepulsion.strength)
            .distanceMax(forces.subClusterRepulsion.maxRangeRatio * nodeRadius);
          const adhesionInitialize = adhesion.initialize;
          adhesion.initialize = (nodes, random) => adhesionInitialize(
            // @ts-ignore
            nodes.filter(({ group }) => group === key),
            random,
          );
          const repulsionInitialize = repulsion.initialize;
          repulsion.initialize = (nodes, random) => repulsionInitialize(
            // @ts-ignore
            nodes.filter(({ group }) => group === key),
            random,
          );
          simulation.force(`${key}-adhesion`, adhesion);
          simulation.force(`${key}-repulsion`, repulsion);
        }
      }
    },
    [dragSubject, groups, onDrag, onDragEnd, onDragStart, simulation, svgRef],
  );

  return (
    <svg ref={svgRef} viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}>
      <g>
        {links.map(({ labels, isDirected, source, target }) => (
          <g key={`link-${source}-${target}`}>
            <line
              id={`${source}-${target}`}
              className="link"
              stroke="#999"
              strokeOpacity="0.6"
              markerEnd={isDirected ? "url(#suit)" : undefined}
            />
            {labels && labels.map(label => (
              <text
                className={styles.svgNodeTextLabel}
                textAnchor="middle"
              >
                <textPath href={`#${source}-${target}`}>
                  {label}
                </textPath>
              </text>
            ))}
          </g>
        ))}
      </g>
      <g>
        {nodes.map(({ id, name, __typename = "", labels = [] }) => (
          <g
            key={`node-${id}`}
            className="node"
          >
            <Link
              className={styles.svgLink}
              to={`/${toLinkTypename(__typename)}/${id}`}
            >
              {reverse(labels).map(({ id: labelId, __typename = "" }, i) => (
                <circle
                  key={`circle-${id}-${labelId}`} r={nodeRadius + labelRadius * (labels.length - i)}
                  fill={labelScales[__typename](labelId)}
                />
              ))}
              <circle
                key={`circle-${id}`}
                id={id}
                r={nodeRadius}
                fill={nodeColorScale(__typename)}
              />
              <text
                key={`label-${id}`}
                className={styles.svgNodeText}
                textAnchor="middle"
                y={nodeRadius + fontSize + (labels.length + 1) * labelRadius}
              >
                {name}
              </text>
            </Link>
            {labels.map(({ id: labelId, __typename, value }, i) => (
              <Link
                key={`label-${id}-${labelId}`}
                className={styles.svgLink}
                to={`/${toLinkTypename(__typename)}/${labelId}`}
              >
                <text
                  className={styles.svgNodeTextLabel}
                  textAnchor="middle"
                  y={nodeRadius + fontSize + (labels.length + 1) * labelRadius + (labelFontSize + labelRadius) * (i + 1)}
                >
                  {value}
                </text>
              </Link>
            ))}
          </g>
        ))}
        {groups.map(({ key, label, size }, i) => size === 0 ? null : (
          <g
            key={key || `${i}-label-${label || ""}`}
            className="group"
          >
            {label && (
              <text
                className={styles.svgGroupText}
                textAnchor="middle"
                alignmentBaseline="text-before-edge"
                opacity={groupLabelOpacity}
              >
                {label}
              </text>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
};
