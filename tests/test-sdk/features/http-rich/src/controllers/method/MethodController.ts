import { Controller, Head, Header, Options } from "@nestjs/common";

@Controller("http_rich/method/method")
export class MethodMethodController {
  @Header("something", "interesting")
  @Head("head")
  public head(): void {}

  @Options("options")
  public options(): void {}
}
