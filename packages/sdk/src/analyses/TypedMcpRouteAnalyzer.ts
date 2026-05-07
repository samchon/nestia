import { IReflectController } from "../structures/IReflectController";
import { IReflectMcpOperation } from "../structures/IReflectMcpOperation";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";

/**
 * Builds {@link ITypedMcpRoute} entries from a reflected MCP operation,
 * assigning a stable `["mcp", toolName]` accessor for SDK file emission.
 *
 * @author wildduck - https://github.com/wildduck2
 */
export namespace TypedMcpRouteAnalyzer {
  export const analyze = (props: {
    controller: IReflectController;
    operation: IReflectMcpOperation;
  }): ITypedMcpRoute[] => [
    {
      protocol: "mcp",
      controller: props.controller,
      name: props.operation.name,
      toolName: props.operation.toolName,
      title: props.operation.title,
      toolDescription: props.operation.toolDescription,
      accessor: accessor(props.operation.toolName),
      function: props.operation.function,
      input: props.operation.parameters[0] ?? null,
      returnType: props.operation.returnType,
      inputSchema: props.operation.inputSchema,
      outputSchema: props.operation.outputSchema,
      annotations: props.operation.annotations,
      imports: props.operation.imports,
      description: props.operation.description,
      jsDocTags: props.operation.jsDocTags,
    },
  ];

  const accessor = (toolName: string): string[] => {
    const safe = toolName.replace(/[^A-Za-z0-9_$]/g, "_");
    return ["mcp", safe];
  };
}
