import { tags } from "typia";

export interface IHeaders {
  "x-category": "x" | "y" | "z";
  "x-memo"?: string;

  /** @default Samchon */
  "x-name"?: string;
  "x-values": number[] & tags.MinItems<1>;
  "x-flags": boolean[] & tags.MinItems<1>;

  /** @ignore */
  "X-descriptions": string[] & tags.MinItems<1>;
}
