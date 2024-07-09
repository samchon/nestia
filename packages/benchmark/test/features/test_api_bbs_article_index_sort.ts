import {
  ArrayUtil,
  GaffComparator,
  RandomGenerator,
  TestValidator,
} from "@nestia/e2e";

import api from "../api";
import { IBbsArticle } from "../api/structures/bbs/IBbsArticle";
import { IPage } from "../api/structures/common/IPage";

export async function test_api_bbs_article_index_sort(
  connection: api.IConnection,
): Promise<void> {
  // GENERATE 100 ARTICLES
  const section: string = "general";
  await ArrayUtil.asyncRepeat(100)(() =>
    api.functional.bbs.articles.create(connection, section, {
      writer: RandomGenerator.name(),
      title: RandomGenerator.paragraph(5)(),
      body: RandomGenerator.content(8)()(),
      format: "txt",
      files: [],
      password: RandomGenerator.alphabets(8),
    }),
  );

  // PREPARE VALIDATOR
  const validator = TestValidator.sort("BbsArticleProvider.index()")(async (
    sort: IPage.Sort<IBbsArticle.IRequest.SortableColumns>,
  ) => {
    const page: IPage<IBbsArticle.ISummary> =
      await api.functional.bbs.articles.index(connection, section, {
        limit: 100,
        sort,
      });
    return page.data;
  });

  // DO VALIDATE
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
    await comp("+", false);
    await comp("-", false);
  }
}
