import core from "@nestia/core";
import { Controller, Header, Post } from "@nestjs/common";

@Controller("plain")
export class PlainController {
  @Header("Content-Type", "text/plain")
  @Post("string")
  public async string(@core.PlainBody() body: string): Promise<string> {
    return body;
  }

  @Header("Content-Type", "text/plain")
  @Post("template")
  public async template(
    @core.PlainBody()
    body: `something_${number}_interesting_${string}_is_not_${boolean}_it?`,
  ): Promise<string> {
    return body;
  }

  @Header("Content-Type", "text/plain")
  @Post("constant")
  public async constant(
    @core.PlainBody() body: "A" | "B" | "C",
  ): Promise<string> {
    return body;
  }
}
