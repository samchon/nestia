import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "../api";
import { IBbsArticle } from "../api/structures/bbs/IBbsArticle";

export async function test_api_bbs_article_at(
  connection: api.IConnection,
): Promise<void> {
  // STORE A NEW ARTICLE
  const stored: IBbsArticle = await api.functional.bbs.articles.create(
    connection,
    "general",
    {
      writer: "Robot",
      title: "Hello, world!",
      body: "Hello, I'm test automation robot",
      format: "txt",
      files: [
        {
          name: "logo",
          extension: "png",
          url: "https://somewhere.com/logo.png",
        },
      ],
      password: "1234",
    },
  );

  // READ IT
  const read: IBbsArticle = await api.functional.bbs.articles.at(
    connection,
    stored.section,
    stored.id,
  );

  // CHECK EQUALITY
  TestValidator.equals("stored vs. read")(stored)(read);

  // TRY 404 ERRORS
  await TestValidator.error("wrong section")(() =>
    api.functional.bbs.articles.at(connection, v4(), stored.id),
  );
  await TestValidator.error("wrong id")(() =>
    api.functional.bbs.articles.at(connection, stored.section, v4()),
  );
}
