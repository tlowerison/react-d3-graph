export function json(object: any, filter: string): any;

export function raw(jsonString: string, filter: string): string;

export const onInitialized: {
  addListener: (fn: Function) => void;
};

export const promised: {
  json: (object: any, filter: string) => Promise<any>;
  raw: (jsonString: string, filter: string) => Promise<string>;
};
