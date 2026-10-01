import core from "@nestia/core";
import { Controller, Version } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IVersioned } from "@api/lib/structures/IVersioned";

@Controller("ver")
export class VersionedController {
  @Version("1")
  @core.TypedRoute.Get()
  public index(): IVersioned {
    return { version: "1", id: null };
  }

  @Version("2")
  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: string): IVersioned {
    return { version: "2", id };
  }

  @Version("1")
  @core.WebSocketRoute("socket")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IVersioned.IProvider, null>,
  ): Promise<void> {
    await acceptor.accept({ version: () => "1" });
  }
}
