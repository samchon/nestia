import path from "path";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { McpRouteProgrammer } from "../programmers/McpRouteProgrammer";
import { McpRouteReturnProgrammer } from "../programmers/McpRouteReturnProgrammer";

/**
 * Rewrites `@McpRoute(...)` decorator calls at compile time.
 *
 * Responsibilities:
 *
 * 1. Normalize the public string form (`@McpRoute("tool_name")`) into an internal
 *    config object literal (`@McpRoute({ name: "tool_name" })`) so downstream
 *    consumers — runtime adaptor + SDK reflection — only ever see the rich
 *    object shape.
 * 2. Enforce MCP-spec constraints by delegating to typia validators:
 *
 *    - Exactly one `@McpRoute.Params()` parameter;
 *    - Parameter type is an object without dynamic properties
 *         ({@link McpRouteProgrammer});
 *    - Return type is `void` or a single object without dynamic properties
 *         ({@link McpRouteReturnProgrammer}).
 * 3. Inject typia-generated `inputSchema` (and `outputSchema`, when the return
 *    type is non-void) into the config literal.
 * 4. Parse the method's JSDoc and inject `description` / `title` into the config
 *    literal when not already explicit. The JSDoc comment is the canonical
 *    source for human-readable tool metadata.
 *
 * @author wildduck - https://github.com/wildduck2
 */
export namespace McpRouteTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    decorator: ts.Decorator;
    method: ts.MethodDeclaration;
  }): ts.Decorator => {
    if (!ts.isCallExpression(props.decorator.expression))
      return props.decorator;

    const signature = props.context.checker.getResolvedSignature(
      props.decorator.expression,
    );
    if (!signature?.declaration) return props.decorator;

    const location = path.resolve(
      signature.declaration.getSourceFile().fileName,
    );
    if (LIB_PATHS.every((str) => location.indexOf(str) === -1))
      return props.decorator;

    // Already transformed (config has injected inputSchema entry — second run).
    if (
      props.decorator.expression.arguments.length >= 1 &&
      ts.isObjectLiteralExpression(props.decorator.expression.arguments[0]!) &&
      hasField(
        props.decorator.expression.arguments[0] as ts.ObjectLiteralExpression,
        "inputSchema",
      )
    )
      return props.decorator;

    enforceParams(props);

    const paramsType = findParamsType(props);
    const inputSchema = McpRouteProgrammer.generate({
      context: props.context,
      modulo: props.decorator.expression.expression,
      type: paramsType,
    });

    // Validate the return type to catch MCP-illegal shapes at compile time
    // (non-object, dynamic-property records, mixed `void | object` unions).
    // We do NOT emit `outputSchema` onto the wire — declaring an output schema
    // obliges the server to return `structuredContent` per the MCP spec, which
    // the v1 adaptor does not produce. Validation alone is enough to honour
    // the constraint.
    const returnType = getReturnType(props);
    if (returnType)
      McpRouteReturnProgrammer.generate({
        context: props.context,
        modulo: props.decorator.expression.expression,
        type: returnType,
      });

    const config: ts.ObjectLiteralExpression = normalizeConfig(
      props.decorator.expression.arguments[0],
    );

    const enriched = injectFields(config, [
      ...(!hasField(config, "inputSchema")
        ? [
            ts.factory.createPropertyAssignment(
              "inputSchema",
              inputSchema as ts.Expression,
            ),
          ]
        : []),
      ...jsDocFields(props.method, config),
    ]);

    return ts.factory.createDecorator(
      ts.factory.updateCallExpression(
        props.decorator.expression,
        props.decorator.expression.expression,
        props.decorator.expression.typeArguments,
        [enriched],
      ),
    );
  };

  /**
   * Reject methods that do not expose exactly one `@McpRoute.Params()` argument
   * object. MCP tools do not have positional arguments.
   */
  const enforceParams = (props: { method: ts.MethodDeclaration }): void => {
    const decorated = props.method.parameters
      .map((param, index) => ({ param, index }))
      .filter(({ param }) => hasParamsDecorator(param));
    if (decorated.length !== 1)
      throw new Error(
        `[@nestia.core.McpRoute] method ${props.method.name.getText()} must declare exactly one @McpRoute.Params() parameter.`,
      );
    if (props.method.parameters.length !== 1 || decorated[0]!.index !== 0)
      throw new Error(
        `[@nestia.core.McpRoute] method ${props.method.name.getText()} must have exactly one parameter, and it must be decorated by @McpRoute.Params().`,
      );
  };

  const findParamsType = (props: {
    context: INestiaTransformContext;
    method: ts.MethodDeclaration;
  }): ts.Type => {
    for (const param of props.method.parameters) {
      if (hasParamsDecorator(param))
        return props.context.checker.getTypeAtLocation(param);
    }
    throw new Error(
      `[@nestia.core.McpRoute] method ${props.method.name.getText()} must declare exactly one @McpRoute.Params() parameter.`,
    );
  };

  const hasParamsDecorator = (param: ts.ParameterDeclaration): boolean => {
    const decos = (param.modifiers ?? []).filter((m) =>
      ts.isDecorator(m),
    ) as ts.Decorator[];
    return decos.some((d) =>
      d.expression.getText().includes("McpRoute.Params"),
    );
  };

  const getReturnType = (props: {
    context: INestiaTransformContext;
    method: ts.MethodDeclaration;
  }): ts.Type | undefined => {
    const sig = props.context.checker.getSignatureFromDeclaration(props.method);
    if (!sig) return undefined;
    return props.context.checker.getReturnTypeOfSignature(sig);
  };

  /**
   * Convert a string literal argument (`@McpRoute("name")`) into the canonical
   * object form (`@McpRoute({ name: "name" })`). If the argument is already an
   * object literal it is returned unchanged. Anything else (computed
   * expressions etc.) is rejected via TransformerError so the wire metadata
   * stays statically analyzable.
   */
  const normalizeConfig = (
    arg: ts.Expression | undefined,
  ): ts.ObjectLiteralExpression => {
    if (arg === undefined)
      return ts.factory.createObjectLiteralExpression([], true);
    if (ts.isStringLiteralLike(arg))
      return ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            "name",
            ts.factory.createStringLiteral(arg.text),
          ),
        ],
        true,
      );
    if (ts.isObjectLiteralExpression(arg)) return arg;
    throw new Error(
      "[@nestia.core.McpRoute] argument must be a string literal or object literal so the tool name can be statically resolved.",
    );
  };

  /**
   * Parse the JSDoc block attached to `method` and emit the property
   * assignments needed to set `description` / `title` when the existing config
   * object does not already define them.
   */
  const jsDocFields = (
    method: ts.MethodDeclaration,
    config: ts.ObjectLiteralExpression,
  ): ts.PropertyAssignment[] => {
    const docs = ts.getJSDocCommentsAndTags(method);
    let description: string | undefined;
    let title: string | undefined;

    for (const d of docs) {
      if (!ts.isJSDoc(d)) continue;
      const raw =
        typeof d.comment === "string"
          ? d.comment
          : (d.comment?.map((n) => n.text).join("") ?? undefined);
      if (raw !== undefined && raw.trim().length !== 0)
        description = raw.trim();

      for (const tag of d.tags ?? []) {
        const name = tag.tagName.getText();
        const text =
          typeof tag.comment === "string"
            ? tag.comment
            : tag.comment?.map((n) => n.text).join("");
        if (name === "title" && text !== undefined && text.trim().length !== 0)
          title = text.trim();
      }
    }

    const out: ts.PropertyAssignment[] = [];
    if (description !== undefined && !hasField(config, "description"))
      out.push(
        ts.factory.createPropertyAssignment(
          "description",
          ts.factory.createStringLiteral(description),
        ),
      );
    if (title !== undefined && !hasField(config, "title"))
      out.push(
        ts.factory.createPropertyAssignment(
          "title",
          ts.factory.createStringLiteral(title),
        ),
      );
    return out;
  };

  const hasField = (
    config: ts.ObjectLiteralExpression,
    name: string,
  ): boolean =>
    config.properties.some(
      (p) =>
        ts.isPropertyAssignment(p) && !!p.name && propertyName(p.name) === name,
    );

  const propertyName = (name: ts.PropertyName): string | undefined =>
    ts.isIdentifier(name)
      ? name.escapedText.toString()
      : ts.isStringLiteralLike(name)
        ? name.text
        : undefined;

  const injectFields = (
    config: ts.ObjectLiteralExpression,
    additions: ts.PropertyAssignment[],
  ): ts.ObjectLiteralExpression =>
    additions.length === 0
      ? config
      : ts.factory.updateObjectLiteralExpression(config, [
          ...config.properties,
          ...additions,
        ]);
}

const LIB_PATHS = [
  path.join("@nestia", "core", "lib", "decorators", "McpRoute.d.ts"),
  path.join("packages", "core", "src", "decorators", "McpRoute.ts"),
];
