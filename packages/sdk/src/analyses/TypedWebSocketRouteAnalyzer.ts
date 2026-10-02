import { IReflectController } from "../structures/IReflectController";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { PathUtil } from "../utils/PathUtil";

/**
 * Turns a reflected WebSocket operation into typed routes, one per path.
 *
 * @evidence contracts/common.md#principled-implementation Each path gets an accessor from its segments and the method name, and the parameters are split by category.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor rule is generic.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation TypedWebSocketRouteAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace TypedWebSocketRouteAnalyzer {
  /**
   * Returns one typed WebSocket route per path, with the header, path
   * parameters, query, acceptor, and driver separated.
   *
   * @evidence contracts/common.md#principled-implementation The parameters are filtered by category, the acceptor is required by the reflection, and the accessor combines the path segments and the method name.
   * @evidence contracts/common.md#clear-and-simple-design One mapping.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It only reorganizes reflected data.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation TypedWebSocketRouteAnalyzer.analyze analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const analyze = (props: {
    controller: IReflectController;
    operation: IReflectWebSocketOperation;
    paths: string[];
  }): ITypedWebSocketRoute[] =>
    props.paths.map((path) => ({
      ...props.operation,
      controller: props.controller,
      key: props.operation.name,
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
