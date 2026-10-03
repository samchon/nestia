import { TypedHeaders, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { QueryFalseINestQuery } from "../../../structures/query_false/INestQuery";
import { QueryFalseIOptionalQuery } from "../../../structures/query_false/IOptionalQuery";
import { QueryFalseIQuery } from "../../../structures/query_false/IQuery";
import { QueryFalseIQueryHeaders } from "../../../structures/query_false/IQueryHeaders";
import { QueryFalseIIgnoredQuery } from "../../../structures/query_false/IRequiredShapes";

@Controller("http_rich/options/query_false/query")
export class QueryFalseController {
  @TypedRoute.Get("typed")
  public async typed(
    @TypedQuery() query: QueryFalseIQuery,
  ): Promise<QueryFalseIQuery> {
    return query;
  }

  @TypedRoute.Get("nest")
  public async nest(
    @Query() query: QueryFalseINestQuery,
  ): Promise<QueryFalseIQuery> {
    return {
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      enforce: query.enforce === "true",
      atomic: query.atomic === "null" ? null : query.atomic,
      values: query.values,
    };
  }

  @TypedRoute.Get("optional")
  public async optional(
    @TypedQuery() query: QueryFalseIOptionalQuery,
  ): Promise<QueryFalseIOptionalQuery> {
    return query;
  }

  @TypedRoute.Get("ignored")
  public async ignored(
    @TypedQuery() query: QueryFalseIIgnoredQuery,
  ): Promise<void> {
    query;
  }

  @TypedRoute.Get("headers")
  public async headers(
    @TypedQuery() query: QueryFalseIQuery,
    @TypedHeaders() headers: QueryFalseIQueryHeaders,
  ): Promise<QueryFalseIQueryHeaders> {
    query;
    return headers;
  }

  @TypedRoute.Get("individual")
  public async individual(@Query("id") id: string): Promise<string> {
    return id;
  }

  @TypedRoute.Get("composite")
  public async composite(
    @Query("atomic") atomic: string,
    @TypedQuery() query: Omit<QueryFalseIQuery, "atomic">,
  ): Promise<QueryFalseIQuery> {
    return {
      ...query,
      atomic,
    };
  }
}
