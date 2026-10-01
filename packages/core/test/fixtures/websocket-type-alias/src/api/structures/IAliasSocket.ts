import { Driver, WebSocketAcceptor } from "tgrid";

export interface IAliasHeader {
  name: string;
}

export interface IAliasProvider {
  greet(): Promise<string>;
}

export interface IAliasListener {
  notify(route: string): void;
}

/** An alias of the whole acceptor, declared apart from the controller. */
export type AliasAcceptor = WebSocketAcceptor<
  IAliasHeader,
  IAliasProvider,
  IAliasListener
>;

/** A generic alias passing its parameter through, or else its default. */
export type ProviderAcceptor<Provider extends object = IAliasProvider> =
  WebSocketAcceptor<IAliasHeader, Provider, IAliasListener>;

/** An alias naming the generic alias above. */
export type ChainedAcceptor = ProviderAcceptor<IAliasProvider>;

export type AliasDriver = Driver<IAliasListener>;
