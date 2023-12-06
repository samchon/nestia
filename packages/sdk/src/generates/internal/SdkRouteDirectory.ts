import { IRoute } from "../../structures/IRoute";

export class SdkRouteDirectory {
  public readonly module: string;
  public readonly children: Map<string, SdkRouteDirectory>;
  public readonly routes: IRoute[];

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
