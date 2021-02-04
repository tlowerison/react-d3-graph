import { Forces, GraphGroup, GraphLink, GraphNode } from "./types";
import { drag } from "d3-drag";
import {
  forceCollide,
  forceLink,
  forceX,
  forceY,
  forceManyBody,
  forceSimulation,
} from "d3-force";
import { select } from "d3-selection";
import { groupBy, lensProp, mapObjIndexed, view } from "ramda";
import { polygonCentroid } from "./polygon";

const simulation = forceSimulation();

const dragSubject = (event: any) => simulation.find(event.x , event.y);

const onDragStart = (event: any) => {
  if (!event.active) {
    simulation.alphaTarget(0.3).restart();
  }
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
};

const onDrag = (event: any) => {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
};

const onDragEnd = (event: any) => {
  if (!event.active) {
    simulation.alphaTarget(0);
  }
  event.subject.fx = null;
  event.subject.fy = null;
};

type Config = {
  forces: Forces;
  groups: GraphGroup[];
  links: GraphLink[];
  nodes: GraphNode[];
  nodeRadius: number;
  svg: SVGSVGElement;
};

export const computeSimulation = async ({ forces, groups, links, nodes, nodeRadius, svg }: Config) => {
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
};
