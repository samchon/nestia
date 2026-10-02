import core from "@nestia/core";
import { Controller, Get } from "@nestjs/common";

@Controller("headers")
export class HeadersController {
  @Get()
  public headers(@core.TypedHeaders() value: string): string {
    return value;
  }
}
