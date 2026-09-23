import { tags } from "typia";

/**
 * Values JSON cannot hold, which the SDK metadata carries by name or by digits
 * and the cloned DTO must write back exactly.
 */
export interface ILiteralValues {
  literal: 5n;
  negative: -7n;
  huge: 12345678901234567890n;
  ranged: bigint & tags.Minimum<3n> & tags.Maximum<9007199254740992n>;
  infinite: 1e999;
  union: -1e999 | 1;
  bounded: number & tags.Minimum<1e999>;
  low: number & tags.ExclusiveMinimum<-1e999>;
  finite: number & tags.Minimum<3>;
  /** @maximum Infinity */
  upper: number;
  /** Tag values whose type is not the tagged one. */
  sequenced: bigint & tags.Sequence<1>;
  named: number & tags.Example<"Infinity">;
  digits: bigint & tags.Example<"12345678901234567890">;
}

/**
 * A bound no literal type spells, reachable through a vanilla `@Body()`, which
 * no transform validates.
 */
export interface INaNBound {
  /** @minimum NaN */
  nan: number;
}
