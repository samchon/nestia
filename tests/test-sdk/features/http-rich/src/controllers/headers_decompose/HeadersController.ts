import core from "@nestia/core";
import { Controller, Headers } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "../../structures/headers_decompose/IBbsArticle";
import { IHeaders } from "../../structures/headers_decompose/IHeaders";

@Controller("http_rich/headers_decompose/headers/:section")
export class HeadersDecomposeHeadersController {
  @core.TypedRoute.Patch()
  public emplace(
    @core.TypedHeaders() headers: IHeaders,
    @core.TypedParam("section") section: string,
  ): IHeaders {
    section;
    return headers;
  }

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
