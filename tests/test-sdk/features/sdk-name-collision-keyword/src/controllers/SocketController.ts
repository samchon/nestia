import { WebSocketRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { IShadow } from "@api/lib/structures/IShadow";

export interface IEcho {
  echo(): string[];
}

/**
 * WebSocket routes whose path parameters are named after the SDK's own
 * positional parameters and locals, or whose name is one of those locals.
 */
@Controller("socket")
export class SocketController {
  @WebSocketRoute(":url/:connector/:driver/:connection/:provider")
  public async locals(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IEcho, null>,
    @WebSocketRoute.Param("url") url: string,
    @WebSocketRoute.Param("connector") connector: string,
    @WebSocketRoute.Param("driver") driver: string,
    @WebSocketRoute.Param("connection") connection: string,
    @WebSocketRoute.Param("provider") provider: string,
    @WebSocketRoute.Query() search: IShadow,
  ): Promise<void> {
    await acceptor.accept({
      echo: () => [url, connector, driver, connection, provider, search.value],
    });
  }

  @WebSocketRoute("query/:query")
  public async query(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IEcho, null>,
    @WebSocketRoute.Param("query") query: string,
    @WebSocketRoute.Query() search: IShadow,
  ): Promise<void> {
    await acceptor.accept({ echo: () => [query, search.value] });
  }

  @WebSocketRoute("url")
  public async url(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, IEcho, null>,
  ): Promise<void> {
    await acceptor.accept({ echo: () => ["url"] });
  }
}
