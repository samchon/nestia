export interface IHeaders {
  "x-category": "x" | "y" | "z";
  "x-memo"?: string;

  /** @default Samchon */
  "x-name"?: string;
  "x-values": number[];
  "x-flags": boolean[];

  /** @ignore */
  "X-descriptions": string[];
}
