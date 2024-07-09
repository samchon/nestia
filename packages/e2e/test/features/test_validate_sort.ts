import { GaffComparator, TestValidator } from "@nestia/e2e";

import { generate_random_articles } from "./internal/generate_random_articles";
import { IBbsArticle } from "./structures/IBbsArticle";
import { IPage } from "./structures/IPage";

export async function test_validate_sort(): Promise<void> {
  const validator = TestValidator.sort("sort")<
    IBbsArticle.ISummary,
    IBbsArticle.IRequest.SortableColumns
  >(async (sort) => {
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
