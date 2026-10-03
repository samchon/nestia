import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { QueryTrueINestQuery } from "../../structures/query_true/QueryTrueINestQuery";
import { QueryTrueIQuery } from "../../structures/query_true/QueryTrueIQuery";

@Controller("http_rich/query_true")
export class QueryTrueController {
  @TypedRoute.Get("typed")
  public async typed(
    @TypedQuery() query: QueryTrueIQuery,
  ): Promise<QueryTrueIQuery> {
    return query;
  }

  @TypedRoute.Get("nest")
  public async nest(
    @Query() query: QueryTrueINestQuery,
  ): Promise<QueryTrueIQuery> {
    return {
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      enforce: query.enforce === "true",
      atomic: query.atomic === "null" ? null : query.atomic,
      values: query.values,
    };
  }

  @TypedRoute.Get("individual")
  public async individual(@Query("id") id: string): Promise<string> {
    return id;
  }

  @TypedRoute.Get("composite")
  public async composite(
    @Query("atomic") atomic: string,
    @TypedQuery() query: Omit<QueryTrueIQuery, "atomic">,
  ): Promise<QueryTrueIQuery> {
    return {
      ...query,
      atomic,
    };
  }
}
