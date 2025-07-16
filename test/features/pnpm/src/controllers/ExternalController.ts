import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { INestiaConfig } from "@nestia/sdk";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

import { ISomething } from "@api/lib/structures/ISomething";

import { INothing } from "../api/structures/INothing";

@Controller("external")
export class ExternalController {
  @TypedRoute.Post("config/:id")
  public async config(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedQuery() query: Partial<INothing>,
    @TypedBody() body: ISomething,
  ): Promise<INestiaConfig> {
    id;
    query;
    body;
    return typia.random<INestiaConfig>();
  }
}
