import core from "@nestia/core";
import { Controller, Header, Post } from "@nestjs/common";

@Controller("plain")
export class PlainController {
  @Header("Content-Type", "text/plain")
  @Post()
  public async send(@core.PlainBody() body?: string): Promise<string> {
    return body ?? "";
  }
}
