import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("users")
export class UserController {
  @core.TypedRoute.Get("@me/permissions")
  public async permissions(): Promise<string[]> {
    return [];
  }
}
