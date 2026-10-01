import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { ISearch } from "@api/lib/structures/IDestructured";

export interface IEcho {
  echo(): string[];
}

/** A WebSocket route whose handler destructures its query object. */
@Controller("destructured/socket")
export class DestructuredSocketController {
  @WebSocketRoute(":id")
  public async connect(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IEcho, null>,
    @WebSocketRoute.Param("id") id: string,
    @WebSocketRoute.Query() { keyword }: ISearch,
  ): Promise<void> {
    await acceptor.accept({ echo: () => [id, keyword ?? "none"] });
  }
}
