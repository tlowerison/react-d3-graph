import React from "react";
import styles from "./styles.module.scss";

type Props = {
  fontSize: number;
  groupLabelOpacity: number;
  label: string;
};

export const Group = ({ fontSize, groupLabelOpacity, label }: Props) => (
  <g className="group">
    {label && (
      <text
        className={styles.svgGroupText}
        textAnchor="middle"
        alignmentBaseline="text-before-edge"
        opacity={groupLabelOpacity}
        style={{ fontSize: fontSize }}
      >
        {label}
      </text>
    )}
  </g>
);
