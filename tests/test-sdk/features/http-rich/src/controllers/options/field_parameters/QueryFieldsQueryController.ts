import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { IQueryFieldsBigQuery } from "../../../structures/options/field_parameters/IQueryFieldsBigQuery";
import { IQueryFieldsBusinessListingFilters } from "../../../structures/options/field_parameters/IQueryFieldsBusinessListingFilters";
import { IQueryFieldsNestQuery } from "../../../structures/options/field_parameters/IQueryFieldsNestQuery";
import { IQueryFieldsQuery } from "../../../structures/options/field_parameters/IQueryFieldsQuery";

@Controller("http_rich/options/field_parameters/query/query")
export class QueryFieldsQueryController {
  @TypedRoute.Get("typed")
  public async typed(
    @TypedQuery() query: IQueryFieldsQuery,
  ): Promise<IQueryFieldsQuery> {
    return query;
  }

  @TypedRoute.Get("typed-enum-array")
  public async typedEnumArray(
    @TypedQuery() filters: IQueryFieldsBusinessListingFilters,
  ): Promise<IQueryFieldsBusinessListingFilters> {
    return filters;
  }

  @TypedRoute.Get("nest")
  public async nest(
    @Query() query: IQueryFieldsNestQuery,
  ): Promise<IQueryFieldsQuery> {
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
    @TypedQuery() query: Omit<IQueryFieldsQuery, "atomic">,
  ): Promise<IQueryFieldsQuery> {
    return {
      ...query,
      atomic,
    };
  }

  @TypedQuery.Post("body")
  public async body(
    @TypedQuery.Body() query: IQueryFieldsQuery,
  ): Promise<IQueryFieldsQuery> {
    return query;
  }

  @TypedQuery.Post("big")
  public async big(
    @TypedQuery.Body() input: IQueryFieldsBigQuery,
  ): Promise<IQueryFieldsBigQuery> {
    return input;
  }
}
