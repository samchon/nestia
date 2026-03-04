export interface IHeaders {
  "x-name"?: string;
  "x-category": "x" | "y" | "z";
  "x-memo"?: string;
  "x-values": number[];
  "x-flags": boolean[];
  "set-cookie": string;
}
