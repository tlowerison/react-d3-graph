import React from "react";
import styles from "./styles.module.scss";

type Props = {
  fontSize: number;
  groupLabelOpacity: number;
  name: string | undefined;
};

export const Group = ({ fontSize, groupLabelOpacity, name }: Props) => (
  <g className="group">
    {name && (
      <text
        className={styles.svgGroupText}
        textAnchor="middle"
        alignmentBaseline="text-before-edge"
        opacity={groupLabelOpacity}
        style={{ fontSize: fontSize }}
      >
        {name}
      </text>
    )}
  </g>
);
