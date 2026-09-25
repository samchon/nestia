import core from "@nestia/core";
import { Controller, Version } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IVersioned } from "../api/structures/IVersioned";

@Controller({ path: "override", version: "1" })
export class OverrideController {
  @Version("2")
  @core.TypedRoute.Get()
  public index(): IVersioned {
    return { version: "2", id: null };
  }

  @core.TypedRoute.Get("inherit")
  public inherit(): IVersioned {
    return { version: "1", id: null };
  }

  @Version("2")
  @core.WebSocketRoute("socket")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IVersioned.IProvider, null>,
  ): Promise<void> {
    await acceptor.accept({ version: () => "2" });
  }
}
