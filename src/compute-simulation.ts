import { Forces, GraphGroup, GraphLink, GraphNode } from "./types";
import { drag } from "d3-drag";
import { expectedWindowWidth } from "./constants";
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
  labelRadius: number;
  links: GraphLink[];
  nameFontSize: number;
  nodes: GraphNode[];
  nodeRadius: number;
  svg: SVGSVGElement;
  width: number;
};

export const computeSimulation = async ({
  forces,
  groups,
  height,
  labelRadius,
  links,
  nameFontSize,
  nodes,
  nodeRadius,
  svg,
  width,
}: Config) => {
  const groupsSelection = select(svg).selectAll(".group").data(groups);
  const nodesSelection = select(svg).selectAll(".node > a > circle").data(nodes);
  const nodeTextsSelection = select(svg).selectAll(".node > a > text").data(nodes);
  const linksSelection = select(svg).selectAll(".link").data(links);

  select(window).on('resize.updatesvg', () => {
    select(svg).attr("viewBox", `${-width * window.innerWidth / expectedWindowWidth / 2} ${-height / 2} ${width * window.innerWidth / expectedWindowWidth} ${height}`);
  });

  const quarterNodeRadius = nodeRadius / 4;

  // @ts-ignore
  simulation.nodes(nodes).on("tick", () => {
    const xRange = [-width * window.innerWidth / expectedWindowWidth / 2, width * window.innerWidth / expectedWindowWidth / 2];
    const yRange = [-height / 2, height / 2 - 2];
    const getX = (x: number, width: number = nodeRadius) => Math.max(xRange[0] + width, Math.min(x, xRange[1] - width));
    const getY = (y: number, height: number = nodeRadius) => Math.max(yRange[0] + height, Math.min(y, yRange[1] - height));
    nodesSelection
      .attr("cx", d => d.x = getX(d.x))
      .attr("cy", d => d.y = getY(d.y))
    nodeTextsSelection.attr("transform", function({ labels, x, y }) {
      // @ts-ignore
      const bBox = this.getBBox && this?.getBBox();
      const width = bBox?.width || 2 * nodeRadius;
      const height = bBox?.height || 2 * nodeRadius;
      const textYMargin = nodeRadius + nameFontSize + (labels.length + 1) * labelRadius;
      return `translate(${getX(x, width / 2)},${getY(y + textYMargin, height / 2) - textYMargin})`;
    });
    linksSelection // @ts-ignore
      .attr("x1", ({ source }) => source.x) // @ts-ignore
      .attr("y1", ({ source }) => source.y) // @ts-ignore
      .attr("x2", ({ target }) => target.x) // @ts-ignore
      .attr("y2", ({ target }) => target.y) // @ts-ignore

    const centroids = mapObjIndexed(
      (nodes: GraphNode[]) => {
        const [x, y] = polygonCentroid(nodes.map(({ x, y }) => [getX(x), getY(y)]));
        return [x, y + quarterNodeRadius];
      }, // @ts-ignore
      groupBy(view(lensProp("group")), nodesSelection.data()),
    ); // @ts-ignore
    groupsSelection.attr("transform", function({ key }) {
      // @ts-ignore
      const bBox = this.getBBox && this?.getBBox();
      const width = bBox?.width || 2 * nodeRadius;
      const height = bBox?.height || 2 * nodeRadius;
      const [x, y] = centroids[key];
      return `translate(${getX(x, width / 2)},${getY(y + quarterNodeRadius, height / 2) - quarterNodeRadius})`;
    });
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
