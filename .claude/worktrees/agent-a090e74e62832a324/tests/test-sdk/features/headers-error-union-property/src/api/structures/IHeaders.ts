export interface IHeaders {
  "x-name"?: string;
  "x-category": "x" | "y" | "z";
  "x-memo"?: string | number | boolean;
  "x-values": number[];
  "x-flags": boolean[];
  "x-descriptions": string[];
}
