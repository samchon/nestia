import { IReflectController } from "../structures/IReflectController";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";

export namespace TypedWebSocketRouteAnalyzer {
  export const analyze = (props: {
    controller: IReflectController;
    operation: IReflectWebSocketOperation;
    paths: string[];
  }): ITypedWebSocketRoute[] =>
    props.paths.map((path) => ({
      ...props.operation,
      controller: props.controller,
      path,
      accessors: ["@lazy"],
    }));
}
