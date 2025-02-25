import React from "react";
import { GraphLink } from "./types";
import styles from "./styles.module.scss";

type Props = Omit<GraphLink, "direction"> & {
  markerEnd: boolean;
};

export const Link = ({ className, labels, markerEnd, source, style, target }: Props) => (
  <g
    key={`link-${source}-${target}`}
    className={className}
    style={style}
  >
    <line
      id={`${source}-${target}`}
      className="link"
      stroke="#999"
      strokeOpacity="0.6"
      markerEnd={markerEnd ? "url(#suit)" : undefined}
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
);
