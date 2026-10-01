import core from "@nestia/core";
import { Controller, Request } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticleBody } from "../structures/IBbsArticleBody.js";

@Controller("body/body")
export class TypedBodyController {
  /**
   * Store an article.
   *
   * @author Samchon
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   * @warning This is an fake API
   */
  @core.TypedRoute.Post()
  public async store(
    @Request() request: any,
    @core.TypedBody() input: IBbsArticleBody.IStoreBody,
  ): Promise<IBbsArticleBody> {
    request;
    const output: IBbsArticleBody = {
      ...typia.random<IBbsArticleBody>(),
      ...input,
    };
    return output;
  }

  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: IBbsArticleBody.IUpdateBody,
  ): Promise<void> {
    id;
    input;
  }
}
