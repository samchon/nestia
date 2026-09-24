import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";
import { tags } from "typia";

/**
 * Routes named after identifiers the generated SDK file binds or reads in its
 * module scope: its imports, the globals its bodies call, and the names
 * TypeScript reserves there.
 */
@Controller("scope")
export class ScopeController {
  @core.TypedRoute.Get("tags/:id")
  public tags(@core.TypedParam("id") id: string & tags.Format<"uuid">): string {
    return id;
  }

  @core.TypedRoute.Get("typia")
  public typia(): string {
    return "typia";
  }

  @core.TypedRoute.Get("fetcher")
  public PlainFetcher(): string {
    return "PlainFetcher";
  }

  @core.TypedRoute.Get("exports")
  public exports(): string {
    return "exports";
  }

  @core.TypedRoute.Get("string/:value")
  public String(
    @core.TypedParam("value") value: string,
    @Query("q") q: string,
  ): string[] {
    return [value, q];
  }
}
