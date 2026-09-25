import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IDotSegment, IDotSegmentEcho } from "../api/structures/IDotSegment";

@Controller("dots")
export class DotSegmentController {
  /** The parent route a dot segment would reach instead. */
  @core.TypedRoute.Get()
  public index(): IDotSegment {
    return { value: "index" };
  }

  @core.TypedRoute.Get(":value")
  public at(@core.TypedParam("value") value: string): IDotSegment {
    return { value };
  }

  @core.WebSocketRoute("socket/:value")
  public async socket(
    @core.WebSocketRoute.Param("value") value: string,
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IDotSegmentEcho, null>,
  ): Promise<void> {
    await acceptor.accept({ echo: () => value });
  }
}
