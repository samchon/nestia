import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { INestQuery } from "@api/lib/structures/INestQuery";
import { IOptionalQuery } from "@api/lib/structures/IOptionalQuery";
import { IQuery } from "@api/lib/structures/IQuery";
import { IIgnoredQuery } from "@api/lib/structures/IRequiredShapes";

@Controller("query")
export class QueryController {
  @TypedRoute.Get("typed")
  public async typed(@TypedQuery() query: IQuery): Promise<IQuery> {
    return query;
  }

  @TypedRoute.Get("nest")
  public async nest(@Query() query: INestQuery): Promise<IQuery> {
    return {
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      enforce: query.enforce === "true",
      atomic: query.atomic === "null" ? null : query.atomic,
      values: query.values,
    };
  }

  @TypedRoute.Get("optional")
  public async optional(
    @TypedQuery() query: IOptionalQuery,
  ): Promise<IOptionalQuery> {
    return query;
  }

  @TypedRoute.Get("ignored")
  public async ignored(@TypedQuery() query: IIgnoredQuery): Promise<void> {
    query;
  }

  @TypedRoute.Get("individual")
  public async individual(@Query("id") id: string): Promise<string> {
    return id;
  }

  @TypedRoute.Get("composite")
  public async composite(
    @Query("atomic") atomic: string,
    @TypedQuery() query: Omit<IQuery, "atomic">,
  ): Promise<IQuery> {
    return {
      ...query,
      atomic,
    };
  }
}
