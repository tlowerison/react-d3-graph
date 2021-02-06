import React from "react";
import styles from "./styles.module.scss";
import { GraphNodeLabel } from "./types";
import { reverse } from "ramda";

type Props = {
  __typename?: string;
  id: string;
  className?: string | Record<string, string>;
  labels?: GraphNodeLabel[];
  labelFontSize: number;
  labelRadius: number;
  labelScales: Record<string, (labelId: string) => string>;
  name: string;
  nameFontSize: number;
  nodeColorScale: (__typename: string) => string;
  radius: number;
  style: React.SVGAttributes<SVGGElement>["style"] | undefined;
}

const toLinkTypename = (__typename: string | undefined) => __typename ? `${__typename.toLowerCase()}s` : "";

export const Node = ({
  __typename = "",
  id,
  className,
  labels = [],
  labelFontSize,
  labelRadius,
  labelScales,
  name,
  nameFontSize,
  nodeColorScale,
  radius,
  style,
}: Props) => (
  <g
    key={`node-${id}`}
    className={`node ${(!className || typeof className === "string" ? className : className[__typename]) || ""}`}
    style={!style || !style[__typename] ? style : style[__typename]}
  >
    <a
      className={styles.svgLink}
      href={`/${toLinkTypename(__typename)}/${id}`}
    >
      <circle
        key={`circle-${id}`}
        id={id}
        r={radius}
        fill={nodeColorScale(__typename)}
      >
        {reverse(labels).map(({ id: labelId, __typename = "" }, i) => (
          <circle
            key={`circle-${id}-${labelId}`} r={radius + labelRadius * (labels.length - i)}
            fill={labelScales[__typename](labelId)}
          />
        ))}
      </circle>
      <text
        key={`label-${id}`}
        className={styles.svgNodeText}
        textAnchor="middle"
        style={{ fontSize: nameFontSize }}
        y={radius + nameFontSize + (labels.length + 1) * labelRadius}
      >
        {name}
      </text>
    </a>
    {labels.map(({ id: labelId, __typename, value }, i) => (
      <a
        key={`label-${id}-${labelId}`}
        className={styles.svgLink}
        href={`/${toLinkTypename(__typename)}/${labelId}`}
      >
        <text
          className={styles.svgNodeTextLabel}
          textAnchor="middle"
          style={{ fontSize: labelFontSize }}
          y={radius + nameFontSize + (labels.length + 1) * labelRadius + (labelFontSize + labelRadius) * (i + 1)}
        >
          {value}
        </text>
      </a>
    ))}
  </g>
);
