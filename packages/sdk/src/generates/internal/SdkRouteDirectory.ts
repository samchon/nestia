import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "../../structures/ITypedMcpRoute";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";

/**
 * One directory of the functional tree: its parent, its name, its module path,
 * its children, and its routes.
 *
 * @evidence contracts/common.md#principled-implementation The module path is the parent's path with the name, from `api.functional`.
 * @evidence contracts/common.md#clear-and-simple-design One class of four members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The members are set once and only the collections grow.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 */
export class SdkRouteDirectory {
  public readonly module: string;
  public readonly children: Map<string, SdkRouteDirectory>;
  public readonly routes: Array<
    ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute
  >;

  public constructor(
    readonly parent: SdkRouteDirectory | null,
    readonly name: string,
  ) {
    this.children = new Map();
    this.routes = [];
    this.module =
      this.parent !== null ? `${this.parent.module}.${name}` : `api.${name}`;
  }
}
