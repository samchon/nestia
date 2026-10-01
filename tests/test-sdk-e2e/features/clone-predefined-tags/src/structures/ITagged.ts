import { tags } from "typia";

/** A user's own tag, named like `tags.Minimum` but validating nothing. */
export type MinimumOf<N extends number> = tags.TagBase<{
  target: "number";
  kind: "minimum";
  value: N;
  validate: "true";
  exclusive: ["minimum", "exclusiveMinimum"];
  schema: { minimum: N };
}>;

/**
 * Every predefined typia tag, one custom tag named alike, a bound only a
 * non-finite value spells, and a JSDoc comment tag.
 */
export interface ITagged {
  minimum: number & tags.Minimum<3>;
  negative: number & tags.Minimum<-1.5>;
  maximum: number & tags.Maximum<10>;
  exclusiveMinimum: number & tags.ExclusiveMinimum<0>;
  exclusiveMaximum: number & tags.ExclusiveMaximum<1e21>;
  multipleOf: number & tags.MultipleOf<5>;
  bigMinimum: bigint & tags.Minimum<3n>;
  bigMaximum: bigint & tags.Maximum<5n>;
  bigMultipleOf: bigint & tags.MultipleOf<2n>;
  int32: number & tags.Type<"int32">;
  uint64: number & tags.Type<"uint64">;
  bigUint64: bigint & tags.Type<"uint64">;
  double: number & tags.Type<"double">;
  uuid: string & tags.Format<"uuid">;
  dateTime: string & tags.Format<"date-time">;
  pattern: string & tags.Pattern<"^[a-z]+\\d*$">;
  minLength: string & tags.MinLength<1> & tags.MaxLength<9>;
  mediaType: string & tags.ContentMediaType<"image/png">;
  items: string[] & tags.MinItems<1> & tags.MaxItems<3> & tags.UniqueItems;
  fallback: number & tags.Default<3>;
  bigFallback: bigint & tags.Default<3n>;
  sample: string & tags.Example<"x">;
  samples: string & tags.Examples<{ a: "x"; b: "y" }>;
  sequenced: number & tags.Sequence<7>;
  custom: number & MinimumOf<7>;
  unbounded: number & tags.Minimum<1e999>;
  /** @format uri */
  commented: string;
}
