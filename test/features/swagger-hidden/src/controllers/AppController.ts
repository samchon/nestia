import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  /** @internal */
  @Get("internal")
  public internal(): Array<number> {
    return [0];
  }

  /** @ignore */
  @Get("hidden")
  public hidden(): Array<number> {
    return [0];
  }

  /** @ignore */
  @Get("ignore")
  public ignore(): Array<number> {
    return [0];
  }
}
