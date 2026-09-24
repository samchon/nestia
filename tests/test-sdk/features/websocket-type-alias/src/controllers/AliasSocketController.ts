import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import {
  WebSocketAcceptor as Acceptor,
  Driver,
  Driver as Remote,
  WebSocketAcceptor,
} from "tgrid";

import {
  AliasAcceptor,
  AliasDriver,
  ChainedAcceptor,
  IAliasHeader,
  IAliasListener,
  IAliasProvider,
  ProviderAcceptor,
} from "@api/lib/structures/IAliasSocket";

/** An alias declared beside the routes, over the renamed import. */
type LocalAcceptor = Acceptor<IAliasHeader, IAliasProvider, IAliasListener>;

/** Routes spelling the tgrid acceptor and driver types other than directly. */
@Controller("alias")
export class AliasSocketController {
  @core.WebSocketRoute("renamed")
  public async renamed(
    @core.WebSocketRoute.Acceptor()
    acceptor: Acceptor<IAliasHeader, IAliasProvider, IAliasListener>,
    @core.WebSocketRoute.Driver() driver: Remote<IAliasListener>,
  ): Promise<void> {
    await accept("renamed", acceptor, driver);
  }

  @core.WebSocketRoute("local")
  public async local(
    @core.WebSocketRoute.Acceptor() acceptor: LocalAcceptor,
  ): Promise<void> {
    await accept("local", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("aliased")
  public async aliased(
    @core.WebSocketRoute.Acceptor() acceptor: AliasAcceptor,
    @core.WebSocketRoute.Driver() driver: AliasDriver,
  ): Promise<void> {
    await accept("aliased", acceptor, driver);
  }

  @core.WebSocketRoute("generic")
  public async generic(
    @core.WebSocketRoute.Acceptor() acceptor: ProviderAcceptor<IAliasProvider>,
  ): Promise<void> {
    await accept("generic", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("defaulted")
  public async defaulted(
    @core.WebSocketRoute.Acceptor() acceptor: ProviderAcceptor,
  ): Promise<void> {
    await accept("defaulted", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("chained")
  public async chained(
    @core.WebSocketRoute.Acceptor() acceptor: ChainedAcceptor,
  ): Promise<void> {
    await accept("chained", acceptor, acceptor.getDriver());
  }

  @core.WebSocketRoute("imported")
  public async imported(
    @core.WebSocketRoute.Acceptor()
    acceptor: import("tgrid").WebSocketAcceptor<
      IAliasHeader,
      IAliasProvider,
      IAliasListener
    >,
    @core.WebSocketRoute.Driver()
    driver: import("tgrid").Driver<IAliasListener>,
  ): Promise<void> {
    await accept("imported", acceptor, driver);
  }

  @core.WebSocketRoute("importedAlias")
  public async importedAlias(
    @core.WebSocketRoute.Acceptor()
    acceptor: import("@api/lib/structures/IAliasSocket").ProviderAcceptor<IAliasProvider>,
  ): Promise<void> {
    await accept("importedAlias", acceptor, acceptor.getDriver());
  }
}

const accept = (
  route: string,
  acceptor: WebSocketAcceptor<IAliasHeader, IAliasProvider, IAliasListener>,
  driver: Driver<IAliasListener>,
): Promise<void> =>
  acceptor.accept({
    greet: async () => {
      await driver.notify(route);
      return `hello ${acceptor.header.name}`;
    },
  });
