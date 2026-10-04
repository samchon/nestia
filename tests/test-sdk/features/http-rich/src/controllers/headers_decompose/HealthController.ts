import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/headers_decompose/health")
export class HeadersDecomposeHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
