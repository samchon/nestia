import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ISearchQuery } from "@api/lib/structures/ISearchQuery";

@Controller("search")
export class SearchController {
  @core.TypedRoute.Get()
  public search(@core.TypedQuery() query: ISearchQuery): ISearchQuery {
    return query;
  }
}
