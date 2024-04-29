import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";

export class SdkRouteDirectory {
  public readonly module: string;
  public readonly children: Map<string, SdkRouteDirectory>;
  public readonly routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>;

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
