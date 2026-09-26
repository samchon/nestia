import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IReserved, IReservedEcho } from "@api/lib/structures/IReserved";

/** A literal colon as find-my-way (Fastify) spells it. */
@Controller("fastify")
export class FastifyReservedController {
  @core.TypedRoute.Post("items::batchGet")
  public batchGet(): IReserved {
    return { route: "batchGet" };
  }

  @core.WebSocketRoute("room::join")
  public async join(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IReservedEcho, null>,
  ): Promise<void> {
    await acceptor.accept({ echo: () => "join" });
  }
}
