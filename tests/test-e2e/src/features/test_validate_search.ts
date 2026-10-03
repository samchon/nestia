import { TestValidator } from "../../../../packages/e2e/lib";
import { generate_random_articles } from "./internal/generate_random_articles";
import { IBbsArticle } from "./structures/IBbsArticle";

/**
 * Verifies testValidator.search checks returned article identifier sets for
 * writer and title filters.
 *
 * The local fixture callback implements substring lookup while the supplied
 * expectation filters exact authored field values.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert single writer, single title and combined writer/title requests
 *    exercise independent field combinations; no network boundary is claimed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls TestValidator.search against a local filtering callback for writer, title and combined field criteria.
 * @evidence contracts/testing.md#independent-expectations The authored articles and exact field expectations are independent of the callback's substring filtering.
 * @evidence contracts/testing.md#distinguishing-cases Single writer, single title and combined criteria are exercised on nonempty data; this case does not supply a deliberately incorrect callback.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
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
}
