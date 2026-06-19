import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiOAuth2 } from "@nestjs/swagger";
import typia from "typia";

import { IToken } from "@api/lib/structures/IToken";

@Controller()
export class SecurityController {
  @ApiOAuth2(["write:pets", "read:pets"])
  @core.TypedRoute.Get("oauth2")
  public oauth2(): IToken {
    return typia.random<IToken>();
  }
}
