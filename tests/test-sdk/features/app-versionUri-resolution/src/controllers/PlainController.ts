import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IVersioned } from "../api/structures/IVersioned";

@Controller("plain")
export class PlainController {
  @core.TypedRoute.Get()
  public index(): IVersioned {
    return { version: "none", id: null };
  }

  @core.WebSocketRoute("socket")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IVersioned.IProvider, null>,
  ): Promise<void> {
    await acceptor.accept({ version: () => "none" });
  }
}
