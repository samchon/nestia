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
    }));
}
