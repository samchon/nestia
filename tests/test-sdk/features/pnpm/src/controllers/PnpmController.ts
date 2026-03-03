import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { INestiaConfig } from "@nestia/sdk";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

import { ISomething } from "@api/lib/structures/ISomething";

import { INothing } from "../api/structures/INothing";

@Controller("pnpm")
export class PnpmController {
  @TypedRoute.Post("config/:id")
  public async config(
    @TypedParam("id") id: (string & tags.Format<"uuid">) | null,
    @TypedQuery() query: Partial<ISomething.IQuery>,
    @TypedBody() body: INothing.IBody,
  ): Promise<INestiaConfig.ISwaggerConfig> {
    id;
    query;
    body;
    return typia.random<INestiaConfig.ISwaggerConfig>();
  }

  @TypedRoute.Get("reset")
  public async reset(): Promise<void> {}
}
