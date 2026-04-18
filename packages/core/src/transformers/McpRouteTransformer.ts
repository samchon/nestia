import path from "path";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { McpRouteProgrammer } from "../programmers/McpRouteProgrammer";

/**
 * Rewrites `@McpRoute(...)` decorator calls at compile time.
 *
 * Two responsibilities:
 *
 * 1. Extract the `@McpRoute.Params<T>()` parameter type and inject the
 *    typia-generated JSON Schema as the decorator's second argument (consumed
 *    by {@link McpAdaptor} at runtime and by `@nestia/sdk` at generation time).
 * 2. Parse the method's JSDoc and inject `description` / `title` into the
 *    decorator's config object when the user did not set them explicitly. The
 *    JSDoc comment becomes the single source of truth for human-readable tool
 *    metadata; the decorator config is only needed for identity (`name`) and
 *    explicit overrides.
 */
export namespace McpRouteTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    decorator: ts.Decorator;
    method: ts.MethodDeclaration;
  }): ts.Decorator => {
    // 1. Must be a call expression: @McpRoute(...)
    if (!ts.isCallExpression(props.decorator.expression))
      return props.decorator;

    // 2. Check it's THIS project's McpRoute (not some other lib's)
    const signature = props.context.checker.getResolvedSignature(
      props.decorator.expression,
    );
    if (!signature?.declaration) return props.decorator;

    const location = path.resolve(
      signature.declaration.getSourceFile().fileName,
    );
    if (LIB_PATHS.every((str) => location.indexOf(str) === -1))
      return props.decorator;

    // 3. Already transformed? (2+ args means second run — skip)
    if (props.decorator.expression.arguments.length >= 2)
      return props.decorator;

    // 4. Find the @McpRoute.Params<T>() parameter to extract its type
    const paramsType = findParamsType(props);
    if (!paramsType) return props.decorator; // no Params decorator = no schema to inject

    // 5. Pull JSDoc description / title and merge into the config literal
    //    if the user did not set them explicitly.
    const originalConfig = props.decorator.expression.arguments[0];
    const enrichedConfig =
      originalConfig && ts.isObjectLiteralExpression(originalConfig)
        ? injectJsDoc(props.method, originalConfig)
        : originalConfig;

    // 6. Generate JSON Schema, inject as second decorator arg
    return ts.factory.createDecorator(
      ts.factory.updateCallExpression(
        props.decorator.expression,
        props.decorator.expression.expression,
        props.decorator.expression.typeArguments,
        [
          enrichedConfig ?? props.decorator.expression.arguments[0]!,
          McpRouteProgrammer.generate({
            context: props.context,
            modulo: props.decorator.expression.expression,
            type: paramsType,
          }),
        ],
      ),
    );
  };

  const findParamsType = (props: {
    context: INestiaTransformContext;
    method: ts.MethodDeclaration;
  }): ts.Type | undefined => {
    for (const param of props.method.parameters) {
      const decos = (param.modifiers ?? []).filter((m) =>
        ts.isDecorator(m),
      ) as ts.Decorator[];
      const match = decos.some((d) =>
        d.expression.getText().includes("McpRoute.Params"),
      );
      if (match) return props.context.checker.getTypeAtLocation(param);
    }
    return undefined;
  };

  /**
   * Parse the JSDoc block attached to `method` and return any description and
   * optional `@title` tag content.
   */
  const extractJsDoc = (
    method: ts.MethodDeclaration,
  ): { description?: string; title?: string } => {
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
    return { description, title };
  };

  /**
   * Produce a new object literal that copies `config` and appends `description`
   * / `title` fields taken from `method`'s JSDoc, unless the user already set
   * them explicitly on the literal.
   */
  const injectJsDoc = (
    method: ts.MethodDeclaration,
    config: ts.ObjectLiteralExpression,
  ): ts.ObjectLiteralExpression => {
    const hasField = (name: string): boolean =>
      config.properties.some(
        (p) =>
          ts.isPropertyAssignment(p) &&
          !!p.name &&
          (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) &&
          p.name.getText().replace(/["']/g, "") === name,
      );

    const jsdoc = extractJsDoc(method);
    const extras: ts.PropertyAssignment[] = [];
    if (!hasField("description") && jsdoc.description !== undefined)
      extras.push(
        ts.factory.createPropertyAssignment(
          "description",
          ts.factory.createStringLiteral(jsdoc.description),
        ),
      );
    if (!hasField("title") && jsdoc.title !== undefined)
      extras.push(
        ts.factory.createPropertyAssignment(
          "title",
          ts.factory.createStringLiteral(jsdoc.title),
        ),
      );

    return extras.length === 0
      ? config
      : ts.factory.updateObjectLiteralExpression(config, [
          ...config.properties,
          ...extras,
        ]);
  };
}

const LIB_PATHS = [
  path.join("@nestia", "core", "lib", "decorators", "McpRoute.d.ts"),
  path.join("packages", "core", "src", "decorators", "McpRoute.ts"),
];
