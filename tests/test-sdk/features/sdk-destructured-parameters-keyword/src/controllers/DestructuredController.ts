import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import {
  IArticleInput,
  ISearch,
  ITenantHeaders,
} from "@api/lib/structures/IDestructured";

import { TracedRepository } from "../providers/TracedRepository";

/**
 * Routes whose handlers destructure their parameters, which declare no name the
 * SDK could reuse.
 */
@Controller("destructured")
export class DestructuredController {
  private readonly repository: TracedRepository = new TracedRepository();

  @core.TypedRoute.Post("body")
  public body(@core.TypedBody() { title, body }: IArticleInput): IArticleInput {
    return { title, body };
  }

  @core.TypedRoute.Get("query")
  public query(@core.TypedQuery() { page, keyword }: ISearch): ISearch {
    return { page, keyword };
  }

  @core.TypedRoute.Get("headers")
  public headers(
    @core.TypedHeaders() { "x-tenant": tenant }: ITenantHeaders,
  ): string {
    return tenant;
  }

  @core.TypedRoute.Get("field")
  public field(@Query("page-size") { length }: string): number {
    return length;
  }

  @core.TypedRoute.Post("collide/:body")
  public collide(
    @core.TypedParam("body") body: string,
    @core.TypedBody() { title }: IArticleInput,
  ): string[] {
    return [body, title];
  }

  @core.TypedRoute.Get("traced")
  public async traced(): Promise<string> {
    return this.repository.findPending({ organizationId: "traced" });
  }
}
