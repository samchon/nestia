import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("query")
export class QueryController {
  @TypedRoute.Get("optional")
  public async optional(
    @TypedQuery() query?: IOptionalQuery,
  ): Promise<IOptionalQuery> {
    return (
      query ?? {
        b: 1,
        c: false,
      }
    );
  }
}
export interface IOptionalQuery {
  a?: string;
  b: number;
  c: boolean;
}
