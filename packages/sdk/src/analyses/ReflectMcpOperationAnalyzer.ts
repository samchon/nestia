import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";

import { INestiaProject } from "../structures/INestiaProject";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectImport } from "../structures/IReflectImport";
import { IReflectMcpOperation } from "../structures/IReflectMcpOperation";
import { IReflectMcpOperationParameter } from "../structures/IReflectMcpOperationParameter";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { ParameterNameAnalyzer } from "./ParameterNameAnalyzer";

/**
 * Reflects an `@McpRoute` method into a tool operation.
 *
 * @evidence contracts/common.md#principled-implementation The tool definition comes from the route metadata, the single params parameter is matched with its compile-time type, and combinations with HTTP or WebSocket decorators and extra parameters are errors.
 * @evidence contracts/common.md#clear-and-simple-design One public function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rules follow the decorator contract.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMcpOperationAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace ReflectMcpOperationAnalyzer {
  /**
   * The input of the MCP operation analysis: the project, the controller, the
   * method, and its metadata.
   *
   * @evidence contracts/common.md#principled-implementation The record holds what the analysis needs.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes and the meaning of its members.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMcpOperationAnalyzer.IProps analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface IProps {
    project: Omit<INestiaProject, "config">;
    controller: IReflectController;
    function: Function;
    name: string;
    metadata: IOperationMetadata;
  }

  /**
   * Returns the tool operation of a method, or `null` when the method is not an
   * MCP route or has errors.
   *
   * @evidence contracts/common.md#principled-implementation The method is an MCP route when it carries the route metadata; at most one params parameter is allowed and the function may have at most one argument; the return type and imports come from the metadata.
   * @evidence contracts/common.md#clear-and-simple-design One function that collects errors once and reports them together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rules follow the decorator contract.
   * @evidence contracts/common.md#meaningful-documentation The comment states the null result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectMcpOperationAnalyzer.analyze analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const analyze = (ctx: IProps): IReflectMcpOperation | null => {
    const route:
      | {
          name: string;
          title?: string;
          description?: string;
          inputSchema: object;
          outputSchema?: object;
          annotations?: IReflectMcpOperation.IAnnotations;
        }
      | undefined = Reflect.getMetadata("nestia/McpRoute", ctx.function);
    if (route === undefined) return null;

    const errors: string[] = [];
    const hasHttpRoute: boolean =
      Reflect.getMetadata(PATH_METADATA, ctx.function) !== undefined ||
      Reflect.getMetadata(METHOD_METADATA, ctx.function) !== undefined;
    const hasWebSocketRoute: boolean =
      Reflect.getMetadata("nestia/WebSocketRoute", ctx.function) !== undefined;

    if (hasHttpRoute || hasWebSocketRoute)
      errors.push(
        "@McpRoute must not be combined with HTTP or WebSocket route decorators on the same method.",
      );

    const preconfigured: IReflectMcpOperationParameter.IPreconfigured[] = (
      (Reflect.getMetadata(
        "nestia/McpRoute/Parameters",
        ctx.controller.class.prototype,
        ctx.name,
      ) ?? []) as IReflectMcpOperationParameter.IPreconfigured[]
    ).sort((a, b) => a.index - b.index);

    if (preconfigured.length > 1)
      errors.push(
        "@McpRoute tools may declare at most one @McpRoute.Params() parameter.",
      );
    if (ctx.function.length > 1)
      errors.push(
        "@McpRoute tools must have 0 or 1 parameters (the MCP arguments object).",
      );

    const imports: IReflectImport[] = [];
    const declared: IReflectMcpOperationParameter[] = preconfigured
      .map((p): IReflectMcpOperationParameter | null => {
        const matched: IOperationMetadata.IParameter | undefined =
          ctx.metadata.parameters.find(
            (m: IOperationMetadata.IParameter) => p.index === m.index,
          );
        if (matched === undefined) {
          errors.push(
            `Unable to find parameter type of the ${p.index} (th) argument.`,
          );
          return null;
        }
        if (matched.type === null) {
          errors.push(
            `Failed to analyze the parameter type of ${matched.name ? JSON.stringify(matched.name) : `the ${p.index} (th) argument`}.`,
          );
          return null;
        }
        imports.push(...matched.imports);
        return {
          category: "params" as const,
          name: matched.name,
          index: p.index,
          type: matched.type,
          metadata: matched.primitive,
          imports: matched.imports,
          description: matched.description,
          jsDocTags: matched.jsDocTags,
        };
      })
      .filter((p): p is IReflectMcpOperationParameter => !!p);
    // a destructured parameter declares no name, so it is given one
    const parameters: IReflectMcpOperationParameter[] =
      ParameterNameAnalyzer.name(declared);

    if (ctx.metadata.success?.imports?.length)
      imports.push(...ctx.metadata.success.imports);

    if (errors.length) {
      ctx.project.errors.push({
        file: ctx.controller.file,
        class: ctx.controller.class.name,
        function: ctx.function.name,
        from: ctx.name,
        contents: errors,
      });
      return null;
    }
    return {
      protocol: "mcp",
      name: ctx.name,
      toolName: route.name,
      title: route.title ?? null,
      toolDescription: route.description ?? null,
      inputSchema: route.inputSchema,
      outputSchema: route.outputSchema ?? null,
      annotations: route.annotations ?? null,
      function: ctx.function,
      parameters,
      returnType: ctx.metadata.success?.type ?? null,
      returnMetadata: ctx.metadata.success?.primitive,
      imports: ImportAnalyzer.merge(imports),
      description: ctx.metadata.description ?? null,
      jsDocTags: ctx.metadata.jsDocTags,
    };
  };
}
