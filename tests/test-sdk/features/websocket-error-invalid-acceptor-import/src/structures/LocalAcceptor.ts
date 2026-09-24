/** A local type sharing the name and arity of tgrid's acceptor, nothing else. */
export interface WebSocketAcceptor<Header, Provider, Listener> {
  header: Header;
  provider: Provider;
  listener: Listener;
}
