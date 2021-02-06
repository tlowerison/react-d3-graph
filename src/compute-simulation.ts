import { Forces, GraphGroup, GraphLink, GraphNode } from "./types";
import { drag } from "d3-drag";
import {
  forceCollide,
  forceLink,
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
  height: number;
  links: GraphLink[];
  nodes: GraphNode[];
  nodeRadius: number;
  svg: SVGSVGElement;
  width: number;
};

export const computeSimulation = async ({ forces, groups, height, links, nodes, nodeRadius, svg, width }: Config) => {
  const groupsSelection = select(svg).selectAll(".group").data(groups);
  const nodesSelection = select(svg).selectAll(".node > a > circle").data(nodes);
  const nodeTextsSelection = select(svg).selectAll(".node > a > text").data(nodes);
  const linksSelection = select(svg).selectAll(".link").data(links);

  const quarterNodeRadius = nodeRadius / 4;

  const xRange = [-width / 2 + nodeRadius, width / 2 - nodeRadius];
  const yRange = [-height / 2 + nodeRadius, height / 2 - nodeRadius];
  const getX = (x: number) => Math.max(xRange[0], Math.min(x, xRange[1]));
  const getY = (y: number) => Math.max(yRange[0], Math.min(y, yRange[1]));

  // @ts-ignore
  simulation.nodes(nodes).on("tick", () => {
    nodesSelection
      .attr("cx", d => d.x = getX(d.x))
      .attr("cy", d => d.y = getY(d.y))
    nodeTextsSelection.attr("transform", ({ x, y }) => `translate(${getX(x)},${getY(y)})`);
    linksSelection // @ts-ignore
      .attr("x1", ({ source }) => source.x) // @ts-ignore
      .attr("y1", ({ source }) => source.y) // @ts-ignore
      .attr("x2", ({ target }) => target.x) // @ts-ignore
      .attr("y2", ({ target }) => target.y) // @ts-ignore

    const centroids = mapObjIndexed(
      (nodes: GraphNode[]) => {
        const [x, y] = polygonCentroid(nodes.map(({ x, y }) => [getX(x), getY(y)]));
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

  const linkForce = forceLink(links).id(view(lensProp("id")));

  if (forces.link.distance) {
    linkForce.distance(forces.link.distance)
  } else { // @ts-ignore
    linkForce.strength(forces.link.strength);
  }

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
    .force("repulsion", repulsionForce);

  for (let i = 0; i < groups.length; i += 1) {
    const { key } = groups[i];
    const adhesion = forceManyBody()
      .strength(forces.group.adhesion.strength)
      .distanceMin(forces.group.adhesion.minRange);
    const repulsion = forceManyBody()
      .strength(forces.group.repulsion.strength)
      .distanceMax(forces.group.repulsion.maxRange);
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
