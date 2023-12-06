import { TestValidator } from "../../TestValidator";
import { generate_random_articles } from "./internal/generate_random_articles";
import { IBbsArticle } from "./structures/IBbsArticle";

export async function test_validate_search(): Promise<void> {
  const { data } = generate_random_articles();

  const search = TestValidator.search("search")(
    async (input: IBbsArticle.IRequest) =>
      data.filter((elem) => {
        if (input.search?.writer && !elem.writer.includes(input.search.writer))
          return false;
        if (input.search?.title && !elem.title.includes(input.search.title))
          return false;
        return true;
      }),
  )(data, 10);

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
