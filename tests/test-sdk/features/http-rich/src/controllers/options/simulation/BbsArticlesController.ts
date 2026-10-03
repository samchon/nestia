import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { SimulationIBbsArticle } from "../../../structures/simulation/SimulationIBbsArticle";
import { SimulationIPage } from "../../../structures/simulation/SimulationIPage";
import { SimulationGlobal } from "./SimulationGlobal";

@Controller("http_rich/options/simulation/bbs/:section/articles")
export class SimulationBbsArticlesController {
  /**
   * Paginate entire articles.
   *
   * @param section Section code
   * @param input Page request info
   * @returns Paginated articles with summarized info
   */
  @core.TypedRoute.Patch()
  public async index(
    @core.TypedParam("section") section: string | null,
    @core.TypedBody() input: SimulationIPage.IRequest,
  ): Promise<SimulationIPage<SimulationIBbsArticle.ISummary>> {
    SimulationGlobal.used = true;
    section;
    input;
    return typia.random<SimulationIPage<SimulationIBbsArticle.ISummary>>();
  }

  /**
   * Paginate entire articles (query ver.).
   *
   * @param section Section code
   * @param input Page request info
   * @returns Paginated articles with summarized info
   */
  @core.TypedRoute.Get()
  public async query(
    @core.TypedParam("section") section: string | null,
    @core.TypedQuery() input: SimulationIPage.IRequest,
  ): Promise<SimulationIPage<SimulationIBbsArticle.ISummary>> {
    SimulationGlobal.used = true;
    section;
    input;
    return typia.random<SimulationIPage<SimulationIBbsArticle.ISummary>>();
  }

  /**
   * Read an article.
   *
   * @param section Section code
   * @param id Target article ID
   * @returns Detailed article info
   */
  @core.TypedRoute.Get(":id")
  public async at(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: (string & tags.Format<"uuid">) | null,
  ): Promise<SimulationIBbsArticle> {
    SimulationGlobal.used = true;
    return {
      ...typia.random<SimulationIBbsArticle>(),
      id: id ?? v4(),
      section,
    };
  }

  /**
   * Get first article of a day.
   *
   * @param section Section code
   * @param date Target data
   * @returns The first article info
   */
  @core.TypedRoute.Get("first/:date")
  public async first(
    @core.TypedParam("section") section: string,
    @core.TypedParam("date") date: string & tags.Format<"date">,
  ): Promise<SimulationIBbsArticle> {
    SimulationGlobal.used = true;
    section;
    date;
    return typia.random<SimulationIBbsArticle>();
  }

  /**
   * Store a new article.
   *
   * @param section Section code
   * @param input Content to store
   * @returns Newly archived article
   */
  @core.TypedRoute.Post()
  public async store(
    @core.TypedParam("section") section: string,
    @core.TypedBody() input: SimulationIBbsArticle.IStore,
  ): Promise<SimulationIBbsArticle> {
    SimulationGlobal.used = true;
    return {
      ...typia.random<SimulationIBbsArticle>(),
      section,
      ...input,
    };
  }

  /**
   * Update an article.
   *
   * @param section Section code
   * @param id Target article ID
   * @param input Content to update
   * @returns Updated content
   */
  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: SimulationIBbsArticle.IStore,
  ): Promise<SimulationIBbsArticle> {
    SimulationGlobal.used = true;
    return {
      ...typia.random<SimulationIBbsArticle>(),
      id,
      section,
      ...input,
    };
  }
}
