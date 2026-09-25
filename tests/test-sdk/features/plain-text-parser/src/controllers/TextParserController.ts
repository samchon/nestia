import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("textParser")
export class TextParserController {
  @core.TypedRoute.Post("plain")
  public plain(@core.PlainBody() body: string): string {
    return body;
  }

  @core.EncryptedRoute.Post("encrypted")
  public encrypted(@core.EncryptedBody() body: { value: string }): {
    value: string;
  } {
    return body;
  }
}
