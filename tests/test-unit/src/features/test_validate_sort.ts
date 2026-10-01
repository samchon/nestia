import { GaffComparator, TestValidator } from "@nestia/e2e";

import { generate_random_articles } from "./internal/generate_random_articles";
import { IBbsArticle } from "./structures/IBbsArticle";
import { IPage } from "./structures/IPage";

/**
 * Verifies `TestValidator.sort()` accepts a correctly sorted list for each
 * column and both directions.
 *
 * 1. Build sorted lists of articles by date, string, and two-column keys.
 * 2. Assert every column passes ascending and descending.
 * 3. Assert an unsorted list fails in both directions.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `TestValidator.sort()` with a local generator that sorts articles and asserts acceptance across five column choices and both signs, and refusal of an unsorted list.
 * @evidence contracts/testing.md#independent-expectations The generator sorts with dates and `localeCompare` written in the test, independently of `GaffComparator`, so a comparator that disagrees with them fails.
 * @evidence contracts/testing.md#distinguishing-cases Date, string, and two-column sorts, ascending and descending, are the cases; a hundred entities whose titles are in neither order are the negative case, refused in both directions, so a validator that accepts an unsorted list is detected; the comparators themselves are covered by `test_gaff_comparator_prefix_keys`.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export async function test_validate_sort(): Promise<void> {
  const validator = TestValidator.sort<
    IBbsArticle.ISummary,
    IBbsArticle.IRequest.SortableColumns
  >("sort", async (sort) => {
    const page = await generate({
      sort,
    });
    return page.data;
  });
  const components = [
    validator("created_at")(GaffComparator.dates((x) => x.created_at)),
    validator("updated_at")(GaffComparator.dates((x) => x.updated_at)),
    validator("title")(GaffComparator.strings((x) => x.title)),
    validator("writer")(GaffComparator.strings((x) => x.writer)),
    validator(
      "writer",
      "title",
    )(GaffComparator.strings((x) => [x.writer, x.title])),
  ];
  for (const comp of components) {
    await comp("+");
    await comp("-");
  }

  // a list that is not in the requested order is refused, in both directions
  const unsorted = TestValidator.sort<
    IBbsArticle.ISummary,
    IBbsArticle.IRequest.SortableColumns
  >("unsorted", async () => {
    const data: IBbsArticle.ISummary[] = generate_random_articles().data;
    data.forEach(
      (article, i) =>
        (article.title = String.fromCharCode(97 + (i % 2 === 0 ? i : 25 - i))),
    );
    return data;
  })("title")(GaffComparator.strings((x) => x.title));
  await TestValidator.error("unsorted ascending", () => unsorted("+"));
  await TestValidator.error("unsorted descending", () => unsorted("-"));
}

async function generate(
  input: IBbsArticle.IRequest,
): Promise<IPage<IBbsArticle.ISummary>> {
  const page: IPage<IBbsArticle.ISummary> = generate_random_articles();
  const articles: IBbsArticle.ISummary[] = page.data;

  if (input.sort?.length)
    for (const comp of input.sort.slice().reverse())
      articles.sort((x, y) => {
        const sign = comp[0];
        const column = comp.substring(1);

        const closure = () => {
          if (column === "created_at")
            return (
              new Date(x.created_at).getTime() -
              new Date(y.created_at).getTime()
            );
          else if (column === "updated_at")
            return (
              new Date(x.updated_at).getTime() -
              new Date(y.updated_at).getTime()
            );
          else if (column === "writer") return x.writer.localeCompare(y.writer);
          else return x.title.localeCompare(y.title);
        };
        return sign === "+" ? closure() : -closure();
      });
  else
    articles.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  return page;
}
