import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { IBigQueryQuery } from "../structures/IBigQueryQuery";
import { IBusinessListingFiltersQuery } from "../structures/IBusinessListingFiltersQuery";
import { INestQueryQuery } from "../structures/INestQueryQuery";
import { IQueryQuery } from "../structures/IQueryQuery";

@Controller("query/query")
export class QueryController {
  @TypedRoute.Get("typed")
  public async typed(@TypedQuery() query: IQueryQuery): Promise<IQueryQuery> {
    return query;
  }

  @TypedRoute.Get("typed-enum-array")
  public async typedEnumArray(
    @TypedQuery() filters: IBusinessListingFiltersQuery,
  ): Promise<IBusinessListingFiltersQuery> {
    return filters;
  }

  @TypedRoute.Get("nest")
  public async nest(@Query() query: INestQueryQuery): Promise<IQueryQuery> {
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
    @TypedQuery() query: Omit<IQueryQuery, "atomic">,
  ): Promise<IQueryQuery> {
    return {
      ...query,
      atomic,
    };
  }

  @TypedQuery.Post("body")
  public async body(
    @TypedQuery.Body() query: IQueryQuery,
  ): Promise<IQueryQuery> {
    return query;
  }

  @TypedQuery.Post("big")
  public async big(
    @TypedQuery.Body() input: IBigQueryQuery,
  ): Promise<IBigQueryQuery> {
    return input;
  }
}
