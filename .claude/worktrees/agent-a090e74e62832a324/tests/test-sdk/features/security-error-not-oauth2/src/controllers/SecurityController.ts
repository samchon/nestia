import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiSecurity } from "@nestjs/swagger";
import typia from "typia";

import { IToken } from "@api/lib/structures/IToken";

@Controller()
export class SecurityController {
  @ApiSecurity("bearer", ["x1", "x2"])
  @core.TypedRoute.Get("bearer")
  public bearer(): IToken {
    return typia.random<IToken>();
  }
}
