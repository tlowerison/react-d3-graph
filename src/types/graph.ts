import { GraphLinkDirection } from "./common";

export interface GraphGroup {
  key: string;
  name: string;
  size: number;
}

export interface GraphNode {
  [index: string]: any;
  id: any;
  name: string;
  degree: GraphNodeDegree;
  labels: GraphNodeLabel[];
  radius: number;
   style:
     | React.SVGAttributes<SVGGElement>["style"]
     | Record<string, React.SVGAttributes<SVGGElement>["style"]>
     | undefined;
  __typename?: string | undefined;
}

export interface GraphNodeDegree {
  in: number;
  out: number;
}

export interface GraphNodeLabel {
  [index: string]: any;
  id: any;
  value: string;
  __typename?: string | undefined;
}

export interface GraphLink {
  className: string | undefined;
  labels: string[];
  direction: GraphLinkDirection;
  source: any;
  sourceDegree: GraphNodeDegree;
  style: React.SVGAttributes<SVGGElement>["style"] | undefined;
  target: any;
  targetDegree: GraphNodeDegree;
}

export interface Forces {
  collision: {
    strength: number;
  };
  link: {
    distance?: number;
    strength: number | ((link: GraphLink) => number);
  };
  repulsion: {
    distanceMax?: number;
    distanceMin?: number;
    strength: number;
  };
  group: {
    adhesion: {
      strength: number;
      minRange: number;
    };
    repulsion: {
      strength: number;
      maxRange: number;
    };
  };
}
