import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IAlias } from "@api/lib/structures/IAlias";
import { IGeneric } from "@api/lib/structures/IGeneric";

@Controller("alias")
export class AliasController {
  @TypedRoute.Get()
  public async get(): Promise<IAlias> {
    return typia.random<IAlias>();
  }

  @TypedRoute.Get("generic")
  public async generic(): Promise<IGeneric> {
    return typia.random<IGeneric>();
  }
}
