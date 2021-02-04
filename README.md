## React D3 Graph
A React component which handles converting a root object and a collection of [jmespath](https://jmespath.org/) queries into a list of nodes, links and groups.

### Example
```tsx
import React from "react";
import { Graph, GraphLinkDirection } from "@tlowerison/react-d3-graph";

type Airport = {
  __typename?: "Airport";
  uuid: string;
  name?: string;
  city?: string;
  code?: string;
  airlines?: Airline[];
  upcomingFlights?: Flight[];
};

type Flight = {
  __typename?: "Flight";
  uuid: string;
  code?: string;
  from?: Airport;
  to?: Airport;
  airline?: Airline;
  departure?: string;
  arrival?: string;
};

type Airline = {
  __typename?: "Airline";
  uuid: string;
  name?: string;
  code?: string;
  hubs?: Airport[];
  upcomingFlights?: Flight[];
};

const flight = {
  __typename: "Flight",
  uuid: "0000-00000-0001",
  code: "3368",
  from: {
    __typename: "Airport",
    uuid: "0000-00000-0002",
    name: "San Francisco International Airport",
    city: "San Francisco, CA, United States",
    code: "SFO",
  },
  to: {
    __typename: "Airport",
    uuid: "0000-00000-0003",
    name: "Portland International Airport",
    city: "Portland, OR, United States",
    code: "PDX",
  },
  departure: "2021-01-01T06:00:00.000Z",
  arrival: "2021-01-01T20:00:00.000Z",
  airline: {
    __typename: "Airline",
    uuid: "0000-00000-0004",
    name: "Alaska Airlines",
    code: "UA",
    hubs: [
      {
        __typename: "Airport",
        uuid: "0000-00000-0005",
        name: "Los Angeles International Airport",
        city: "Los Angeles, CA, United States",
        code: "LAX",
      },
      {
        __typename: "Airport",
        uuid: "0000-00000-0006",
        name: "Seattle-Tacoma International Airport",
        city: "Seattle, WS, United States",
        code: "SEA",
      },
      {
        __typename: "Airport",
        uuid: "0000-00000-0002",
        name: "San Francisco International Airport",
        city: "San Francisco, CA, United States",
        code: "SFO",
      },
      {
        __typename: "Airport",
        uuid: "0000-00000-0003",
        name: "Portland International Airport",
        city: "Portland, OR, United States",
        code: "PDX",
        airlines: [
          {
            uuid: "0000-00000-0007",
            name: "Air Canada",
            code: "AC",
          },
          {
            uuid: "0000-00000-0004",
            name: "Alaska Airlines",
            code: "AS",
          },
          {
            uuid: "0000-00000-0008",
            name: "Allegiant Air",
            code: "AAY",
          },
          {
            uuid: "0000-00000-0009",
            name: "American",
            code: "AA",
          },
          {
            uuid: "0000-00000-0010",
            name: "Boutique Air",
            code: "4B",
          },
          {
            uuid: "0000-00000-0011",
            name: "Condor",
            code: "DE",
          },
          {
            uuid: "0000-00000-0012",
            name: "Delta Air Lines",
            code: "DL",
          },
          {
            uuid: "0000-00000-0013",
            name: "Frontier Airlines",
            code: "F9",
          },
          {
            uuid: "0000-00000-0014",
            name: "Hawaiin",
            code: "HA",
          },
          {
            uuid: "0000-00000-0015",
            name: "JetBlue",
            code: "B6",
          },
          {
            uuid: "0000-00000-0016",
            name: "Southwest Airlines",
            code: "WN",
          },
          {
            uuid: "0000-00000-0017",
            name: "Spirit Airlines",
            code: "NK",
          },
          {
            uuid: "0000-00000-0018",
            name: "Sun Country Airlines",
            code: "SY",
          },
          {
            uuid: "0000-00000-0019",
            name: "United Airlines",
            code: "UA",
          },
          {
            uuid: "0000-00000-0020",
            name: "Volaris",
            code: "Y4",
          },
          {
            uuid: "0000-00000-0021",
            name: "WestJet Encore",
            code: "WR",
          },
        ],
      },
      {
        __typename: "Airport",
        uuid: "0000-00000-0022",
        name: "Ted Stevens Anchorage International Airport",
        city: "Anchorage, AK, United States",
        code: "ANC",
      },
    ],
  },
};

export const FlightGraph = () => (
  <>
    <h2>Flight: {flight.code}</h2>
    <Graph
      idField="uuid"
      fontSize={{ nodeName: 7 }}
      showRoot
      config={{
        name: ["code", code => `Flight: ${code}`],
        links: [
          { node: { path: "from" } },
          { node: { path: "to" } },
          {
            node: {
              path: "airline",
              links: [{
                direction: GraphLinkDirection.None,
                node: {
                  path: "hubs",
                  links: [{
                    direction: GraphLinkDirection.None,
                    node: {
                      path: "airlines",
                    },
                  }],
                },
              }],
            },
          },
        ],
      }}
      root={flight}
    />
  </>
);
```
