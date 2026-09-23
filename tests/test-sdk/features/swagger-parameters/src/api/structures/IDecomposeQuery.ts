import { tags } from "typia";

import { DecomposeKind } from "./DecomposeKind";

/**
 * Query object covering every schema shape a decomposed parameter must keep.
 *
 * Each property's parameter schema must equal typia's own value schema of the
 * property: the `IDecomposeQuery` component with the property-level fields
 * (`title`, `description`, `deprecated`, `readOnly`) removed.
 */
export interface IDecomposeQuery {
  from: string & tags.Format<"date-time">;
  limit: number & tags.Minimum<1> & tags.Maximum<100> & tags.Default<10>;
  int32: number & tags.Type<"int32">;
  page?: number & tags.Type<"uint32"> & tags.Default<1>;
  pattern: string & tags.Pattern<"^[a-z]+$">;
  length: string & tags.MinLength<2> & tags.MaxLength<5>;
  multiple: number & tags.MultipleOf<5> & tags.ExclusiveMinimum<0>;
  ids: Array<string & tags.Format<"uuid">> &
    tags.MinItems<1> &
    tags.MaxItems<10> &
    tags.UniqueItems;
  tpl: `${number}`;
  prefixed: `prefix-${string}`;
  literal: "x" | "y";
  kind: DecomposeKind;
  nullable: (string & tags.Format<"email">) | null;
  flag: boolean & tags.Default<true>;
  big: bigint & tags.Type<"uint64">;
  /** @format uuid */
  commentFormat: string;
  /** @minimum 3 */
  commentMinimum: number;
  values: readonly string[];
  generic: ReadonlyArray<string>;
  readonly readonlyProp: string;
  /** Described property. */
  described: string & tags.MaxLength<8>;
  plugin: string & tags.JsonSchemaPlugin<{ "x-foo": "bar" }>;
  example: string & tags.Example<"xyz">;
  anything: any;
  /** @x-custom value */
  custom: string;
  /** @internal */
  internal?: string;
  /** @ignore */
  ignored?: string;
}
