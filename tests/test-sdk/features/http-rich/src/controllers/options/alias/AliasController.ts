import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { AliasOptionIAlias } from "../../../structures/alias/AliasOptionIAlias";
import { AliasOptionIGeneric } from "../../../structures/alias/AliasOptionIGeneric";

@Controller("http_rich/options/alias")
export class OptionAliasController {
  @TypedRoute.Get()
  public async get(): Promise<AliasOptionIAlias> {
    return typia.random<AliasOptionIAlias>();
  }

  @TypedRoute.Get("generic")
  public async generic(): Promise<AliasOptionIGeneric> {
    return typia.random<AliasOptionIGeneric>();
  }
}
