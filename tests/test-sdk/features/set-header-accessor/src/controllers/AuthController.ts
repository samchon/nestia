import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("auth")
export class AuthController {
  /** @setHeader x-token x-token */
  @core.TypedRoute.Post("hyphen")
  public hyphen(): { "x-token": string } {
    return { "x-token": "a" };
  }

  /** @setHeader access.token */
  @core.TypedRoute.Post("dotted")
  public dotted(): { access: { token: string } } {
    return { access: { token: "b" } };
  }
}
