import { tags } from "typia";

export interface IDecomposeHeaders {
  "x-from": string & tags.Format<"date-time">;
  "x-limit": number & tags.Minimum<1> & tags.Maximum<100> & tags.Default<10>;
  "x-int32": number & tags.Type<"int32">;
  "x-ids": Array<string & tags.Format<"uuid">> & tags.MinItems<1>;
  "x-tpl": `${number}`;
  "x-literal": "x" | "y";
  "x-flag"?: boolean & tags.Default<false>;
  /** @deprecated */
  "x-legacy"?: string;
  /** @internal */
  "x-internal"?: string;
}
