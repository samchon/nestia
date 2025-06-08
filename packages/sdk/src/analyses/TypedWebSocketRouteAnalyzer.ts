import { IReflectController } from "../structures/IReflectController";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { PathUtil } from "../utils/PathUtil";

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
      accessor: [...PathUtil.accessors(path), props.operation.name],
      header:
        props.operation.parameters.filter((p) => p.category === "header")[0] ??
        null,
      pathParameters: props.operation.parameters.filter(
        (p) => p.category === "param",
      ),
      query:
        props.operation.parameters.filter((p) => p.category === "query")[0] ??
        null,
      acceptor: props.operation.parameters.filter(
        (p) => p.category === "acceptor",
      )[0]!,
      driver:
        props.operation.parameters.filter((p) => p.category === "driver")[0] ??
        null,
    }));
}
