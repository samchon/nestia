import core from "@nestia/core";
import { Controller, Param } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IPathEcho } from "@api/lib/structures/IPathEcho";

/**
 * Routes in the path syntax of NestJS 11 on Express 5, which the SDK and the
 * Swagger document cannot describe, beside one they can.
 */
@Controller("paths")
export class PathsController {
  @core.TypedRoute.Get("ping")
  public ping(): string {
    return "pong";
  }

  /** A named wildcard, delivered as the segments it spans. */
  @core.TypedRoute.Get("files/*path")
  public file(@Param("path") path: string[]): string {
    return path.join(",");
  }

  /** An optional segment. */
  @core.TypedRoute.Get("users{/:id}")
  public user(@Param("id") id?: string): string {
    return id ?? "none";
  }

  @core.WebSocketRoute("socket/*path")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IPathEcho, null>,
    @core.WebSocketRoute.Param("path") path: string,
  ): Promise<void> {
    await acceptor.accept({ echo: () => path });
  }
}
