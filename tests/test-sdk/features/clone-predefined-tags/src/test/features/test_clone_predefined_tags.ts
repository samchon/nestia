import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { ITagged as Cloned } from "@api/lib/structures/ITagged";

import { ITagged as Source } from "../../structures/ITagged";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Same<T> = {
  [K in keyof T]: K extends keyof Cloned ? Equal<T[K], Cloned[K]> : false;
};

/**
 * Verifies a cloned DTO writes each predefined typia tag as the source did, and
 * a custom tag named alike in the generic form.
 *
 * The SDK recognized a predefined tag by its name, which since v13 lost its
 * brackets and quotes (`Minimum3`, `Formatuuid`), so every cloned tag printed
 * as a `tags.TagBase<{ ... }>` several times longer than its source (#1662). A
 * tag now prints as the predefined tag whose expansion equals it exactly, so
 * the clone is the same type either way; a custom `MinimumOf<7>`, whose
 * validation differs from `tags.Minimum<7>`, keeps the `TagBase` form. The
 * expansion is compared as JSON holds it, so `tags.Minimum<1e999>`, whose
 * schema bound JSON writes as null, is recognized too. A JSDoc comment tag,
 * `@format uri`, keeps printing as the tag it names.
 *
 * 1. Assert at compile time that every property of the clone is the source's type.
 * 2. Read the cloned DTO and assert each predefined tag is written as in the
 *    source, and the custom tag in the `TagBase` form.
 */
export const test_clone_predefined_tags = async (): Promise<void> => {
  const same: Same<Source> = {
    minimum: true,
    negative: true,
    maximum: true,
    exclusiveMinimum: true,
    exclusiveMaximum: true,
    multipleOf: true,
    bigMinimum: true,
    bigMaximum: true,
    bigMultipleOf: true,
    int32: true,
    uint64: true,
    bigUint64: true,
    double: true,
    uuid: true,
    dateTime: true,
    pattern: true,
    minLength: true,
    mediaType: true,
    items: true,
    fallback: true,
    bigFallback: true,
    sample: true,
    samples: true,
    sequenced: true,
    custom: true,
    unbounded: true,
    // the source has a JSDoc comment tag, which the clone writes as a type tag
    commented: false,
  };
  same;

  const content: string = (
    await fs.promises.readFile(
      `${__dirname}/../../api/structures/ITagged.ts`,
      "utf8",
    )
  ).replace(/\s+/g, " ");
  for (const needle of [
    "minimum: number & tags.Minimum<3>;",
    "negative: number & tags.Minimum<-1.5>;",
    "maximum: number & tags.Maximum<10>;",
    "exclusiveMinimum: number & tags.ExclusiveMinimum<0>;",
    "exclusiveMaximum: number & tags.ExclusiveMaximum<1e21>;",
    "multipleOf: number & tags.MultipleOf<5>;",
    "bigMinimum: bigint & tags.Minimum<3n>;",
    "bigMaximum: bigint & tags.Maximum<5n>;",
    "bigMultipleOf: bigint & tags.MultipleOf<2n>;",
    'int32: number & tags.Type<"int32">;',
    'uint64: number & tags.Type<"uint64">;',
    'bigUint64: bigint & tags.Type<"uint64">;',
    'double: number & tags.Type<"double">;',
    'uuid: string & tags.Format<"uuid">;',
    'dateTime: string & tags.Format<"date-time">;',
    'pattern: string & tags.Pattern<"^[a-z]+\\\\d*$">;',
    "minLength: string & tags.MinLength<1> & tags.MaxLength<9>;",
    'mediaType: string & tags.ContentMediaType<"image/png">;',
    "items: string[] & tags.MinItems<1> & tags.MaxItems<3> & tags.UniqueItems<true>;",
    "fallback: number & tags.Default<3>;",
    "bigFallback: bigint & tags.Default<3n>;",
    'sample: string & tags.Example<"x">;',
    'samples: string & tags.Examples<{ a: "x"; b: "y"; }>;',
    "sequenced: number & tags.Sequence<7>;",
    'custom: number & tags.TagBase<{ target: "number"; kind: "minimum"; value: 7; validate: "true";',
    "unbounded: number & tags.Minimum<1e999>;",
    'commented: string & tags.Format<"uri">;',
  ])
    TestValidator.equals(needle, content.includes(needle), true);
};
