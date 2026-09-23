import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { IMixedSearch } from "@api/lib/structures/IMixedSearch";
import { ISearchQuery } from "@api/lib/structures/ISearchQuery";

@Controller("search")
export class SearchController {
  @core.TypedRoute.Get()
  public search(@core.TypedQuery() query: ISearchQuery): ISearchQuery {
    return query;
  }

  @core.TypedRoute.Get("mixed")
  public mixed(@Query() query: IMixedSearch): void {
    query;
  }

  @core.TypedRoute.Get("record")
  public record(@Query() query: Record<string, string>): void {
    query;
  }
}
