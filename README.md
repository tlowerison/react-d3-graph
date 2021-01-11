## React D3 Graph
\[Work in progress\]
A React component which handles converting a root object and a collection of [jmespath](https://jmespath.org/) queries into a list of nodes, links and groups.

### Example
```tsx
import React from "react";
import { Graph } from "@tlowerison/react-d3-graph";

type Service = {
  __typename?: "Service";
  uuid: string;
  name?: string | null;
  scope?: string | null;
  dependencies?: Array<Service | null> | null;
  dependents?: Array<Service | null> | null;
}

interface Props {
  service: Service;
}

export const ServiceGraph = ({ service }: Props) => {
  if (!service) return null;
  return (
    <Graph
      idField="uuid"
      groups={[
        {
          label: "Dependencies",
          nodes: [{ path: "dependencies", label: "scope" }],
        },
        {
          label: "Dependents",
          nodes: [{ path: "dependents", label: "scope" }],
        },
      ]}
      root={service}
    />
  );
};
```
