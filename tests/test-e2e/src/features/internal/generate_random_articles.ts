import { RandomGenerator } from "@nestia/e2e";

import { IBbsArticle } from "../structures/IBbsArticle";
import { IPage } from "../structures/IPage";

/**
 * The helper constructs count article summaries and matching single-page
 * metadata using published random generators.
 *
 * @evidence contracts/common.md#principled-implementation The helper constructs count article summaries and matching single-page metadata using published random generators.
 * @evidence contracts/common.md#clear-and-simple-design One function owns fixture creation for the index, search and sort scenarios.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Random values supply test inputs rather than expected sorting or filtering results.
 * @evidence contracts/common.md#meaningful-documentation The comment explains count, generated data and pagination metadata.
 */
export const generate_random_articles = (
  count: number = 100,
): IPage<IBbsArticle.ISummary> => ({
  pagination: {
    page: 1,
    limit: count,
    total_count: count,
    total_pages: 1,
  },
  data: new Array(count).fill("").map(() => ({
    id: RandomGenerator.alphaNumeric(8),
    writer: RandomGenerator.name(),
    title: RandomGenerator.paragraph(),
    created_at: new Date().toISOString(),
    updated_at: RandomGenerator.date(
      new Date(),
      24 * 60 * 60 * 1000,
    ).toISOString(),
  })),
});
