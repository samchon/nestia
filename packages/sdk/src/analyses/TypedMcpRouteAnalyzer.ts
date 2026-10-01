import {
  MetadataAliasType,
  MetadataArrayType,
  MetadataComponents,
  MetadataObjectType,
  MetadataSchema,
  MetadataTupleType,
} from "../internal/legacy";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectMcpOperation } from "../structures/IReflectMcpOperation";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";

/**
 * Turns a reflected MCP operation into a typed route.
 *
 * @evidence contracts/common.md#principled-implementation An MCP tool is one route whose accessor is `mcp` and the tool name with non-identifier characters replaced.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor rule is generic.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups declarations; analyze owns graph conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained state or handles.
 */
export namespace TypedMcpRouteAnalyzer {
  /**
   * Returns the typed route of an MCP tool: its names, schemas, input
   * parameter, return type, and imports. Clone mode resolves a private copy of
   * the native JSON graph and reports missing or unresolved components.
   *
   * @evidence contracts/common.md#principled-implementation Native primitive pipes describe the same JSON wire values the MCP adaptor serializes. Clone requests require these graphs; source-only routes preserve their declared types and imports.
   * @evidence contracts/common.md#clear-and-simple-design One conversion resolves the input and output against their own components and reports clone metadata failures at the route.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Native JSON pipes are resolved through the shared metadata adapter; source binding names never select a clone exception and native records remain unchanged.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidence contracts/performance.md#efficient-algorithms Clone mode copies each supplied graph payload once, indexes its components and visits each schema and component target once to check reference closure. Work scales with graph vertices, edges and annotation payload; no compiler or type analysis is repeated.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Input and output pipes have independent native component identities, and this operation retains no completed or in-flight request to share across analyses.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Resolution copies and visited sets belong to one synchronous conversion; the returned route retains its reachable graphs, and no global cache, process or handle is created.
   */
  export const analyze = (props: {
    controller: IReflectController;
    operation: IReflectMcpOperation;
    clone?: boolean;
    errors?: IReflectOperationError[];
  }): ITypedMcpRoute[] => {
    const errors: Array<string | IOperationMetadata.IError> = [];
    const cast = (
      pipe: IOperationMetadata.IResponse["primitive"] | undefined,
      position: string,
    ): MetadataSchema | undefined => {
      if (props.clone !== true) return undefined;
      if (pipe === undefined) {
        errors.push(`Missing native JSON metadata for MCP ${position}.`);
        return undefined;
      }
      if (pipe.success === false) {
        errors.push(...pipe.errors);
        return undefined;
      }
      try {
        const data = structuredClone(pipe.data);
        const components = MetadataComponents.from(data.components);
        const metadata = MetadataSchema.from(
          data.metadata,
          components.dictionary,
        );
        const visited = new WeakSet<object>();
        const inspect = (value: MetadataSchema): void => {
          if (visited.has(value)) return;
          visited.add(value);
          for (const kind of [
            "objects",
            "aliases",
            "arrays",
            "tuples",
          ] as const) {
            if (!Array.isArray(value[kind]))
              throw new Error(`Missing ${kind} metadata.`);
            for (const reference of value[kind]) {
              const target = (
                reference as typeof reference & {
                  type?:
                    | MetadataObjectType
                    | MetadataAliasType
                    | MetadataArrayType
                    | MetadataTupleType;
                }
              ).type;
              if (target === undefined)
                throw new Error(
                  `Unresolved ${kind} component ${reference.name}.`,
                );
              if (visited.has(target)) continue;
              visited.add(target);
              if (kind === "objects")
                for (const property of (target as MetadataObjectType)
                  .properties) {
                  inspect(property.key);
                  inspect(property.value);
                }
              else if (kind === "tuples")
                for (const element of (target as MetadataTupleType).elements)
                  inspect(element);
              else
                inspect(
                  (target as MetadataAliasType | MetadataArrayType).value,
                );
            }
          }
          if (value.rest) inspect(value.rest);
          if (value.escaped) {
            inspect(value.escaped.original);
            inspect(value.escaped.returns);
          }
          for (const template of value.templates)
            for (const element of template.row ?? template) inspect(element);
          for (const set of value.sets) inspect(set.value);
          for (const map of value.maps) {
            inspect(map.key);
            inspect(map.value);
          }
          for (const fn of value.functions) {
            for (const parameter of fn.parameters) inspect(parameter.type);
            inspect(fn.output);
          }
        };
        if (!Array.isArray(metadata.objects))
          throw new Error("Missing schema metadata.");
        inspect(metadata);
        return metadata;
      } catch (error) {
        errors.push(
          `Invalid native JSON metadata for MCP ${position}: ${String(error)}`,
        );
        return undefined;
      }
    };
    const inputMetadata = props.operation.parameters[0]
      ? cast(props.operation.parameters[0].metadata, "input")
      : undefined;
    const outputMetadata = cast(props.operation.returnMetadata, "output");
    if (errors.length) {
      const failure: IReflectOperationError = {
        file: props.controller.file,
        class: props.controller.class.name,
        function: props.operation.name,
        from: props.operation.name,
        contents: errors,
      };
      if (props.errors === undefined)
        throw new Error(
          errors
            .map((e) => (typeof e === "string" ? e : e.messages.join("; ")))
            .join("\n"),
        );
      props.errors.push(failure);
      return [];
    }
    return [
      {
        protocol: "mcp",
        controller: props.controller,
        name: props.operation.name,
        toolName: props.operation.toolName,
        title: props.operation.title,
        toolDescription: props.operation.toolDescription,
        accessor: accessor(props.operation.toolName),
        function: props.operation.function,
        input: props.operation.parameters[0]
          ? {
              ...props.operation.parameters[0],
              type: { ...props.operation.parameters[0].type },
            }
          : null,
        returnType: props.operation.returnType,
        inputMetadata,
        outputMetadata,
        inputSchema: props.operation.inputSchema,
        outputSchema: props.operation.outputSchema,
        annotations: props.operation.annotations,
        imports: props.operation.imports,
        description: props.operation.description,
        jsDocTags: props.operation.jsDocTags,
      },
    ];
  };

  const accessor = (toolName: string): string[] => {
    const safe = toolName.replace(/[^A-Za-z0-9_$]/g, "_");
    return ["mcp", safe];
  };
}
