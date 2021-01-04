## React D3 Graph
\[Work in progress\]
A React component which handles converting a root object and a collection of [jq](https://stedolan.github.io/jq/) queries into a list of nodes, links and groups.

### Example
```tsx
import React, { useMemo } from "react";
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
  const groups = useMemo(() => [
    {
      label: "Dependencies",
      nodes: [{ path: ".dependencies", label: ".scope" }],
    },
    {
      label: "Dependents",
      nodes: [{ path: ".dependents", label: ".scope" }],
    },
  ], [service]);

  if (!service) return null;

  return (
    <Graph
      idField="uuid"
      groups={groups}
      root={service}
    />
  );
};
```

### Webpack Build Integration
React D3 graph is built on top of [jq-web](https://github.com/fiatjaf/jq-web)'s `.wasm` module, so while there's no extra work required for use during development, React D3 graph doesn't integrate well with `react-scripts build` (yet) and needs some careful handling in your `webpack.config.js` (or `config-overrides.js` if you use `react-app-rewired`).

```js
// webpack.config.js
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  // ... some configurations
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "node_modules/@tlowerison/react-d3-graph/dist/jq.wasm.wasm",
          to: ".",
        },
      ],
    }),
  ],
  // ... more configurations
};
```
or

```js
// config-overrides.js
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  webpack(config) {
    // ... some configurations
    config.plugins = (config.plugins || []).push(new CopyPlugin({
      patterns: [
        {
          from: "node_modules/@tlowerison/react-d3-graph/dist/jq.wasm.wasm",
          to: ".",
        },
      ],
    }));
    // ... more configurations
    return config;
  },
};
```
