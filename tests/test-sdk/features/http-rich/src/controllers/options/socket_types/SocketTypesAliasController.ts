import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import {
  WebSocketAcceptor as Acceptor,
  Driver,
  Driver as Remote,
  WebSocketAcceptor,
} from "tgrid";

import {
  ISocketTypesAliasHeader,
  ISocketTypesAliasListener,
  ISocketTypesAliasProvider,
  SocketTypesAliasAcceptor,
  SocketTypesAliasDriver,
  SocketTypesChainedAcceptor,
  SocketTypesProviderAcceptor,
} from "../../../structures/options/socket_types/ISocketTypesAliases";

/** An alias declared beside the routes, over the renamed import. */
type SocketTypesLocalAcceptor = Acceptor<
  ISocketTypesAliasHeader,
  ISocketTypesAliasProvider,
  ISocketTypesAliasListener
>;

/** Routes spelling the tgrid acceptor and driver types other than directly. */
@Controller("http_rich/options/socket_types/alias")
export class SocketTypesAliasController {
  @core.WebSocketRoute("renamed")
  public async renamed(
    @core.WebSocketRoute.Acceptor()
    acceptor: Acceptor<
      ISocketTypesAliasHeader,
      ISocketTypesAliasProvider,
      ISocketTypesAliasListener
    >,
    @core.WebSocketRoute.Driver() driver: Remote<ISocketTypesAliasListener>,
  ): Promise<void> {
    await accept("renamed", acceptor, driver);
  }

  @core.WebSocketRoute("local")
  public async local(
    @core.WebSocketRoute.Acceptor() acceptor: SocketTypesLocalAcceptor,
  ): Promise<void> {
    await accept("local", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("aliased")
  public async aliased(
    @core.WebSocketRoute.Acceptor() acceptor: SocketTypesAliasAcceptor,
    @core.WebSocketRoute.Driver() driver: SocketTypesAliasDriver,
  ): Promise<void> {
    await accept("aliased", acceptor, driver);
  }

  @core.WebSocketRoute("generic")
  public async generic(
    @core.WebSocketRoute.Acceptor()
    acceptor: SocketTypesProviderAcceptor<ISocketTypesAliasProvider>,
  ): Promise<void> {
    await accept("generic", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("defaulted")
  public async defaulted(
    @core.WebSocketRoute.Acceptor() acceptor: SocketTypesProviderAcceptor,
  ): Promise<void> {
    await accept("defaulted", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("chained")
  public async chained(
    @core.WebSocketRoute.Acceptor() acceptor: SocketTypesChainedAcceptor,
  ): Promise<void> {
    await accept("chained", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("imported")
  public async imported(
    @core.WebSocketRoute.Acceptor()
    acceptor: import("tgrid").WebSocketAcceptor<
      ISocketTypesAliasHeader,
      ISocketTypesAliasProvider,
      ISocketTypesAliasListener
    >,
    @core.WebSocketRoute.Driver()
    driver: import("tgrid").Driver<ISocketTypesAliasListener>,
  ): Promise<void> {
    await accept("imported", acceptor, driver);
  }

  @core.WebSocketRoute("importedAlias")
  public async importedAlias(
    @core.WebSocketRoute.Acceptor()
    acceptor: import("../../../structures/options/socket_types/ISocketTypesAliases").SocketTypesProviderAcceptor<ISocketTypesAliasProvider>,
  ): Promise<void> {
    await accept("importedAlias", acceptor, acceptor.getDriver());
  }
}

const accept = (
  route: string,
  acceptor: WebSocketAcceptor<
    ISocketTypesAliasHeader,
    ISocketTypesAliasProvider,
    ISocketTypesAliasListener
  >,
  driver: Driver<ISocketTypesAliasListener>,
): Promise<void> =>
  acceptor.accept({
    greet: async () => {
      await driver.notify(route);
      return `hello ${acceptor.header.name}`;
    },
  });
