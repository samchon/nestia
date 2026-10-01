import { IReflectController } from "../structures/IReflectController";
import { IReflectMcpOperation } from "../structures/IReflectMcpOperation";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";

/**
 * Turns a reflected MCP operation into a typed route.
 *
 * @evidence contracts/common.md#principled-implementation An MCP tool is one route whose accessor is `mcp` and the tool name with non-identifier characters replaced.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor rule is generic.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace TypedMcpRouteAnalyzer {
  /**
   * Returns the typed route of an MCP tool: its names, schemas, input
   * parameter, return type, and imports.
   *
   * @evidence contracts/common.md#principled-implementation The fields are copied from the operation and the first parameter is the input.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds only the accessor.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
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
