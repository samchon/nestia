import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import {
  ISocketDotSegment,
  ISocketDotSegmentEcho,
} from "../../../structures/options/stream_dot_paths/ISocketDotSegment";

@Controller("http_rich/options/stream_dot_paths/dots")
export class SocketDotSegmentController {
  /** The parent route a dot segment would reach instead. */
  @core.TypedRoute.Get()
  public index(): ISocketDotSegment {
    return { value: "index" };
  }

  @core.TypedRoute.Get(":value")
  public at(@core.TypedParam("value") value: string): ISocketDotSegment {
    return { value };
  }

  @core.WebSocketRoute("socket/:value")
  public async socket(
    @core.WebSocketRoute.Param("value") value: string,
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, ISocketDotSegmentEcho, null>,
  ): Promise<void> {
    await acceptor.accept({ echo: () => value });
  }
}
