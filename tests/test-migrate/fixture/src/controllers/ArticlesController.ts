import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IArticle } from "../structures/IArticle";
import { IPage } from "../structures/IPage";
import { IProblem } from "../structures/IProblem";
import { IRequestHeaders } from "../structures/IRequestHeaders";

@Controller("articles")
export class ArticlesController {
  /**
   * List article summaries.
   *
   * @summary List articles
   * @tag Articles Article operations
   * @security bearer articles:read
   */
  @core.TypedRoute.Get()
  public index(
    @core.TypedHeaders() headers: IRequestHeaders,
    @core.TypedQuery() query: IArticle.ISearch,
  ): IPage<IArticle.ISummary> {
    void headers;
    void query;
    return {
      pagination: { current: 1, limit: 20, records: 0, pages: 0 },
      data: [],
    };
  }

  /**
   * Read one article.
   *
   * @summary Read article
   * @tag Articles
   * @security bearer articles:read
   */
  @core.TypedException<IProblem>({ status: 404, description: "not found" })
  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: string): IArticle {
    return {
      id,
      title: "fixture",
      body: { type: "text", text: "fixture" },
      status: "draft",
      author: {
        id,
        name: "tester",
        email: "tester@example.com",
      },
      labels: [],
      metrics: {},
      created_at: new Date(0).toISOString(),
      published_at: null,
    };
  }

  /**
   * Create an article.
   *
   * @summary Create article
   * @tag Articles
   * @security bearer articles:write
   */
  @core.SwaggerCustomizer(({ route }) => {
    (route as Record<string, unknown>)["x-fixture"] = "article-create";
  })
  @core.SwaggerExample.Response<IArticle.ISummary>({
    id: "00000000-0000-0000-0000-000000000000",
    title: "fixture",
    status: "draft",
    labels: ["fixture"],
  })
  @core.TypedException<IProblem>({
    status: 422,
    description: "invalid article payload",
    example: {
      code: "INVALID_INPUT",
      message: "invalid article payload",
    },
  })
  @core.TypedRoute.Post()
  public create(
    @core.SwaggerExample.Parameter<IArticle.ICreate>({
      title: "fixture",
      body: { type: "markdown", markdown: "# Fixture", toc: true },
      labels: ["fixture"],
    })
    @core.TypedBody()
    input: IArticle.ICreate,
  ): IArticle.ISummary {
    return {
      id: "00000000-0000-0000-0000-000000000000",
      title: input.title,
      status: "draft",
      labels: input.labels ?? [],
    };
  }

  /**
   * Update an article.
   *
   * @summary Update article
   * @tag Articles
   * @security bearer articles:write
   */
  @core.TypedRoute.Put(":id")
  public update(
    @core.TypedParam("id") id: string,
    @core.TypedBody() input: IArticle.IUpdate,
  ): IArticle.ISummary {
    return {
      id,
      title: input.title ?? "fixture",
      status: input.status ?? "draft",
      labels: input.labels ?? [],
    };
  }

  /**
   * Archive an article.
   *
   * @summary Archive article
   * @tag Articles
   * @security apiKey
   */
  @core.TypedRoute.Delete(":id")
  public erase(@core.TypedParam("id") id: string): void {
    void id;
  }
}
