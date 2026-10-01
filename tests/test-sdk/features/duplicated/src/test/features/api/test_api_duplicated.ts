import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies api duplicated through its generated consumer.
 *
 * The authored DTO and handler supply the observable response contract.
 *
 * 1. Send the retained request through the generated SDK.
 * 2. Validate the response shape or independent payload invariant.
 *
 * @evidence contracts/testing.md#behavioral-verification Both generated duplicated.at and multiple.at requests must return exact IBbsArticle-shaped objects equal to each other, retaining both controller path aliases.
 * @evidence contracts/testing.md#independent-expectations The authored controller declares two paths and returns the same module-local article object for both. That path/handler contract establishes equality; its random fields are not independent literal expectations for article generation.
 * @evidence contracts/testing.md#distinguishing-cases Both aliases must resolve and return equal complete payloads. This owns controller path-array expansion, not random article quality or every routing decorator form.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects native multiple-path metadata, both generated HTTP accessors and the same actual backend handler; direct path joining cannot prove both generated endpoints work.
 * @evidence contracts/e2e.md#shared-execution Packed packages and compatible producer/runtime compilations are shared. These assertions start no independent installation/compiler; sibling transport cases reuse the feature backend, while distinct CLI/file-pattern boundaries retain their own lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored inputs and generated outputs belong to isolated feature trees; values are local and output reads are immutable. The entry rejects empty discovery and finally closes its backend; harness cleanup waits for consuming children before releasing owned trees.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
 */
export const test_api_duplicated = async (
  connection: api.IConnection,
): Promise<void> => {
  const [x, y]: [IBbsArticle, IBbsArticle] = [
    await api.functional.duplicated.at(connection),
    await api.functional.multiple.at(connection),
  ];
  typia.assertEquals([x, y]);

  TestValidator.equals("duplicated", x, y);
};
