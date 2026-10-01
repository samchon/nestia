import { TestValidator } from "@nestia/e2e";

import { generate_random_articles } from "./internal/generate_random_articles";
import { IBbsArticle } from "./structures/IBbsArticle";

/**
 * Verifies `TestValidator.search()` checks a search request against the
 * entities it should return.
 *
 * 1. Search by writer, by title, and by both.
 * 2. Assert each search passes when the filtered result equals the expected one.
 * 3. Assert a search that ignores its request fails.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `TestValidator.search()` against a local search function and asserts it accepts single-field and two-field searches whose results equal the filter's, and refuses a search function that ignores its request.
 * @evidence contracts/testing.md#independent-expectations The oracle is the local `filter` written in the test from the field values of a chosen entity, not the search function under test.
 * @evidence contracts/testing.md#distinguishing-cases One field, another field, and both fields together are the positive cases; a search function that ignores its request and returns every entity is the negative case, which must fail because some returned entity does not satisfy the filter.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-e2e` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_validate_search(): Promise<void> {
  const { data } = generate_random_articles();

  const search = TestValidator.search(
    "search",
    async (input: IBbsArticle.IRequest) =>
      data.filter((elem) => {
        if (input.search?.writer && !elem.writer.includes(input.search.writer))
          return false;
        if (input.search?.title && !elem.title.includes(input.search.title))
          return false;
        return true;
      }),
    data,
    10,
  );

  await search({
    fields: ["writer"],
    values: (entity) => [entity.writer],
    request: (values) => ({ search: { writer: values[0] } }),
    filter: (entity, values) => entity.writer === values[0],
  });
  await search({
    fields: ["title"],
    values: (entity) => [entity.title],
    request: (values) => ({ search: { title: values[0] } }),
    filter: (entity, values) => entity.title === values[0],
  });
  await search({
    fields: ["writer", "title"],
    values: (entity) => [entity.writer, entity.title],
    request: ([writer, title]) => ({
      search: { writer, title: title },
    }),
    filter: (entity, [writer, title]) =>
      entity.writer === writer && entity.title === title,
  });
  // a search that ignores its request returns entities the filter rejects
  await TestValidator.error("ignored request", () =>
    TestValidator.search(
      "ignored request",
      async (_input: IBbsArticle.IRequest) => data,
      data,
      10,
    )({
      fields: ["writer"],
      values: (entity) => [entity.writer],
      request: (values) => ({ search: { writer: values[0] } }),
      filter: (entity, values) => entity.writer === values[0],
    }),
  );
}
