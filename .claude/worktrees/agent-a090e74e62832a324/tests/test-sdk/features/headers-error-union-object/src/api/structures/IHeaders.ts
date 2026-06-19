export type IHeaders = Type1 | Type2;

interface Type1 {
  "x-name"?: string;
  "x-category": "x" | "y" | "z";
  "x-memo"?: string | null;
  "x-values": number[];
  "x-flags": boolean[];
  "x-descriptions": string[];
}

interface Type2 {
  "x-something": boolean;
}
