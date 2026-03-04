export interface IHeaders {
  "x-category": "x" | "y" | "z";
  "x-memo"?: string;
  "x-bigint": bigint;

  /** @default Samchon */
  "x-nAme"?: string;
  "x-values": number[];
  "x-fLags": boolean[];

  /** @ignore */
  "X-Descriptions": string[];
}
