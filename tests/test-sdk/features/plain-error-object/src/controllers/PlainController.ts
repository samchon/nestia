import core from "@nestia/core";
import { Controller, Header, Post } from "@nestjs/common";

import { ISomething } from "../api/structures/ISomething";

@Controller("plain")
export class PlainController {
  @Header("Content-Type", "text/plain")
  @Post()
  public async send(@core.PlainBody() body: ISomething): Promise<string> {
    return JSON.stringify(body);
  }
}
