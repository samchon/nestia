import { tags } from "typia";

export interface IHeaders {
  "x-category": "x" | "y" | "z";
  "x-memo"?: string;
  "x-bigint": bigint;

  /** @default Samchon */
  "x-nAme"?: string;
  "x-values": number[] & tags.MinItems<1>;
  "x-fLags": boolean[] & tags.MinItems<1>;

  /** @ignore */
  "X-Descriptions": string[] & tags.MinItems<1>;
}
