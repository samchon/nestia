import core from "@nestia/core";
import { Controller, Headers, Param } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IHeaders } from "@api/lib/structures/IHeaders";

@Controller("headers/:section")
export class HeadersController {
  @core.TypedQuery.Patch()
  public emplace(
    @core.TypedHeaders() headers: IHeaders,
    @Param("section") section: string,
  ): IHeaders {
    section;
    return headers;
  }

  /**
   * Store a new article.
   *
   * @author Samchon
   * @param headers Headers for authentication
   * @param section Target section code
   * @returns Store article
   */
  @core.TypedRoute.Post()
  public store(
    @Headers() headers: IHeaders,
    @core.TypedParam("section") section: string,
    @core.TypedBody() input: IBbsArticle.IStore,
  ): IBbsArticle {
    section;
    input;
    headers;
    return typia.random<IBbsArticle>();
  }

  /**
   * Update an article.
   *
   * @author Samchon
   * @param section Target section code
   * @param id Target article id
   * @param name Name in header for authentication
   * @param input Content to update
   */
  @core.TypedRoute.Put(":id")
  public update(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @Headers("x-name") name: string,
    @core.TypedBody() input: IBbsArticle.IStore,
  ): void {
    section;
    id;
    name;
    input;
  }
}
