import { Driver, WebSocketAcceptor } from "tgrid";

export interface ISocketTypesAliasHeader {
  name: string;
}

export interface ISocketTypesAliasProvider {
  greet(): Promise<string>;
}

export interface ISocketTypesAliasListener {
  notify(route: string): void;
}

/** An alias of the whole acceptor, declared apart from the controller. */
export type SocketTypesAliasAcceptor = WebSocketAcceptor<
  ISocketTypesAliasHeader,
  ISocketTypesAliasProvider,
  ISocketTypesAliasListener
>;

/** A generic alias passing its parameter through, or else its default. */
export type SocketTypesProviderAcceptor<
  Provider extends object = ISocketTypesAliasProvider,
> = WebSocketAcceptor<
  ISocketTypesAliasHeader,
  Provider,
  ISocketTypesAliasListener
>;

/** An alias naming the generic alias above. */
export type SocketTypesChainedAcceptor =
  SocketTypesProviderAcceptor<ISocketTypesAliasProvider>;

export type SocketTypesAliasDriver = Driver<ISocketTypesAliasListener>;
