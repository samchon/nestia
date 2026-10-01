import { Controller, Head, Header, Options } from "@nestjs/common";

@Controller("method/method")
export class MethodController {
  @Header("something", "interesting")
  @Head("head")
  public head(): void {}

  @Options("options")
  public options(): void {}
}
