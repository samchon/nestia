import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { INestiaConfig } from "@nestia/sdk";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

@Controller("pnpm")
export class PnpmController {
  @TypedRoute.Post("config/:id")
  public async config(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedQuery() query: Partial<IQuery>,
    @TypedBody() body: IBody,
  ): Promise<INestiaConfig.ISwaggerConfig> {
    id;
    query;
    body;
    return typia.random<INestiaConfig.ISwaggerConfig>();
  }

  @TypedRoute.Get("reset")
  public async reset(): Promise<void> {}
}

interface IQuery {
  count: number;
}
interface IBody {
  domain: string;
}
