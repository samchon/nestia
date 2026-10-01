import { RandomGenerator } from "@nestia/e2e";

import { IBbsArticle } from "../structures/IBbsArticle";
import { IPage } from "../structures/IPage";

/**
 * Returns one page of generated article summaries for local validator inputs.
 *
 * @evidence contracts/common.md#principled-implementation The count controls both page totals and the generated data length; each record carries the fields consumed by search and sort validators.
 * @evidence contracts/common.md#clear-and-simple-design One mapping constructs the page data while pagination describes that same count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper uses the actual RandomGenerator API and creates input records without replacing validators.
 * @evidence contracts/common.md#meaningful-documentation Returns one page of generated article summaries for local validator inputs.
 * @evidence contracts/performance.md#efficient-algorithms One pass creates count records, with time and returned storage proportional to count and generated string lengths.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
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
