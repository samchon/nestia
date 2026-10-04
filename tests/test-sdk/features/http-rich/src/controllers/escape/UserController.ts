import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/escape/users")
export class EscapeUserController {
  @core.TypedRoute.Get("@me/permissions")
  public async permissions(): Promise<string[]> {
    return [];
  }
}
