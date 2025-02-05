/**
 * Source of the nestia internal agent.
 *
 * `NestiaAgentSource` is an union type of string literals, which
 * represents the name of internal agents used in the {@link NestiaAgent}.
 *
 * This type string literal union is used in
 * {@link INestiaAgentEvent.IRequest.source} and
 * {@link INestiaAgentEvent.IResponse.source}.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type NestiaAgentSource =
  | "initialize"
  | "select"
  | "cancel"
  | "execute"
  | "describe";
