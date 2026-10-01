import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiSecurity } from "@nestjs/swagger";
import typia from "typia";

import { IToken } from "../api/structures/IToken";

@Controller()
export class SecurityController {
  @ApiSecurity("undeclared")
  @core.TypedRoute.Get("undeclared")
  public undeclared(): IToken {
    return typia.random<IToken>();
  }
}
