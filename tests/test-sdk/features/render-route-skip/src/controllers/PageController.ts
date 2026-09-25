import core from "@nestia/core";
import { Controller, Get, Render } from "@nestjs/common";

@Controller("page")
export class PageController {
  @Get()
  @Render("index")
  public index(): { title: string } {
    return { title: "x" };
  }

  @core.TypedRoute.Get("count")
  public count(): number {
    return 1;
  }
}
