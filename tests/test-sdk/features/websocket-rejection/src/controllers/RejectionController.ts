import core from "@nestia/core";
import { Controller, ForbiddenException } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { IRejection } from "@api/lib/structures/IRejection";

@Controller("rejection")
export class RejectionController {
  @core.WebSocketRoute("validate/:id")
  public async validate(
    @core.WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @core.WebSocketRoute.Header() header: IRejection.IHeader,
    @core.WebSocketRoute.Query() query: IRejection.IQuery,
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<IRejection.IHeader, IRejection.IProvider, null>,
  ): Promise<void> {
    await acceptor.accept({
      echo: (value) => `${id}:${header.name}:${query.count}:${value}`,
      hang: () => new Promise(() => {}),
      trigger: () => {},
    });
  }

  @core.WebSocketRoute("before")
  public async before(
    @core.WebSocketRoute.Acceptor()
    _acceptor: WebSocketAcceptor<undefined, IRejection.IProvider, null>,
  ): Promise<void> {
    throw new Error("thrown before accept");
  }

  @core.WebSocketRoute("forbidden")
  public async forbidden(
    @core.WebSocketRoute.Acceptor()
    _acceptor: WebSocketAcceptor<undefined, IRejection.IProvider, null>,
  ): Promise<void> {
    throw new ForbiddenException("no entry");
  }

  @core.WebSocketRoute("oversized")
  public async oversized(
    @core.WebSocketRoute.Acceptor()
    _acceptor: WebSocketAcceptor<undefined, IRejection.IProvider, null>,
  ): Promise<void> {
    throw new Error(OVERSIZED);
  }

  @core.WebSocketRoute("after")
  public async after(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IRejection.IProvider, null>,
  ): Promise<void> {
    let trigger!: () => void;
    const triggered: Promise<void> = new Promise((resolve) => {
      trigger = resolve;
    });
    await acceptor.accept({
      echo: (value) => value,
      hang: () => new Promise(() => {}),
      trigger: () => trigger(),
    });
    await triggered;
    throw new Error("thrown after accept");
  }
}

/** 1 + 3 × 100 bytes of UTF-8, far over the 123 a close reason holds. */
export const OVERSIZED: string = "a" + "가".repeat(100);
