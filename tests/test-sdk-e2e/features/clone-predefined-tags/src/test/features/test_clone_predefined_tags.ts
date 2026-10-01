import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { ITagged as Cloned } from "@api/lib/structures/ITagged";
import { IUnaccepted as ClonedUnaccepted } from "@api/lib/structures/IUnaccepted";

import { ITagged as Source } from "../../structures/ITagged";
import { IUnaccepted as SourceUnaccepted } from "../../structures/IUnaccepted";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Same<T, U> = {
  [K in keyof T]: K extends keyof U ? Equal<T[K], U[K]> : false;
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
 * `@format uri`, keeps printing as the tag it names. A custom tag expanding
 * like a predefined tag given an argument that tag does not accept, such as
 * `tags.Format<"phone">`, keeps the `TagBase` form too, as the predefined form
 * would not compile.
 *
 * 1. Assert at compile time that every property of the clones is the source's
 *    type.
 * 2. Read the cloned DTOs and assert each predefined tag is written as in the
 *    source, and the custom tags in the `TagBase` form.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual clone declarations must compile property identities against authored types and contain the specified predefined tag spellings; custom validation and unsupported predefined arguments must retain TagBase, including nested/listed/phone controls.
 * @evidence contracts/testing.md#independent-expectations Authored ITagged/IUnaccepted declarations specify numeric/bigint/string/array/default/example/sequence tags and deliberate custom expansions. The expected predefined spellings follow their supported generic signatures; commented URI intentionally becomes a type tag instead of source-type identity.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary and negative/scientific/bigint values, infinity-as-JSON-null, JSDoc URI, custom same-kind/different-validation and invalid predefined argument shapes distinguish compact recognition from overmatching. Text fragments do not certify the whole generated declaration or every runtime tag predicate.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects native tag metadata to actual generated declarations and the consumer compiler. These are generated-output spelling assertions with type controls, not committed-source arrangement checks.
 * @evidence contracts/e2e.md#shared-execution Packed packages and compatible producer/runtime compilations are shared. These assertions start no independent installation/compiler; sibling transport cases reuse the feature backend, while distinct CLI/file-pattern boundaries retain their own lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored inputs and generated outputs belong to isolated feature trees; values are local and output reads are immutable. The entry rejects empty discovery and finally closes its backend; harness cleanup waits for consuming children before releasing owned trees.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
 */
export const test_clone_predefined_tags = async (): Promise<void> => {
  const same: Same<Source, Cloned> = {
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
  const unaccepted: Same<SourceUnaccepted, ClonedUnaccepted> = {
    nested: true,
    listed: true,
    phone: true,
  };
  unaccepted;

  const read = async (name: string): Promise<string> =>
    (
      await fs.promises.readFile(
        `${__dirname}/../../api/structures/${name}.ts`,
        "utf8",
      )
    ).replace(/\s+/g, " ");
  const content: string = await read("ITagged");
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

  const unacceptedContent: string = await read("IUnaccepted");
  for (const needle of [
    'nested: number[][] & tags.TagBase<{ target: "array"; kind: "default"; value: [[1]];',
    'listed: string & tags.TagBase<{ target: "string"; kind: "examples"; value: ["x"];',
    'phone: string & tags.TagBase<{ target: "string"; kind: "format"; value: "phone";',
  ])
    TestValidator.equals(needle, unacceptedContent.includes(needle), true);
};
