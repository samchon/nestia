import { RandomGenerator } from "@nestia/e2e";

import { IBbsArticle } from "../structures/IBbsArticle";
import { IPage } from "../structures/IPage";

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
