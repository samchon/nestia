import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IReserved, IReservedEcho } from "../../api/structures/IReserved";

/** Router-reserved literals as path-to-regexp (Express) escapes them. */
@Controller("express")
export class ExpressReservedController {
  /** An AIP custom method on a collection. */
  @core.TypedRoute.Post("items\\:batchGet")
  public batchGet(): IReserved {
    return { route: "batchGet" };
  }

  /** An AIP custom method on a resource. */
  @core.TypedRoute.Post("items/:id\\:cancel")
  public cancel(@core.TypedParam("id") id: string): IReserved {
    return { route: "cancel", id };
  }

  /** A parenthesis and a star beside a parameter. */
  @core.TypedRoute.Get("a\\(b/:id\\*")
  public paren(@core.TypedParam("id") id: string): IReserved {
    return { route: "paren", id };
  }

  @core.WebSocketRoute("room\\:join")
  public async join(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IReservedEcho, null>,
  ): Promise<void> {
    await acceptor.accept({ echo: () => "join" });
  }
}
