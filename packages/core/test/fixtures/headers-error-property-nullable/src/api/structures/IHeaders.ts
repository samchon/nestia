export interface IHeaders {
  "x-name"?: string;
  "x-category": "x" | "y" | "z";
  "x-memo"?: string | null;
  "x-values": number[];
  "x-flags": boolean[];
  "x-descriptions": string[];
}
