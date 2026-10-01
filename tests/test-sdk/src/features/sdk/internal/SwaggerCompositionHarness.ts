import type { INestiaConfig } from "@nestia/sdk";
import assert from "assert/strict";
import path from "path";
import type { OpenApi } from "typia";

import type { IReflectOperationError } from "../../../../../../packages/sdk/lib/structures/IReflectOperationError";
import type { ITypedHttpRoute } from "../../../../../../packages/sdk/lib/structures/ITypedHttpRoute";

/**
 * Direct owners for authored metadata cases; no application graph is
 * fabricated.
 */
export namespace SwaggerCompositionHarness {
  const load = (file: string) =>
    require(path.resolve(process.cwd(), "../../packages/sdk/lib", file));

  /**
   * Returns typed routes and the actual analysis errors for one authored
   * controller.
   */
  export const analyze = (target: Function) => {
    const { ReflectControllerAnalyzer } = load(
      "analyses/ReflectControllerAnalyzer",
    );
    const { TypedHttpRouteAnalyzer } = load("analyses/TypedHttpRouteAnalyzer");
    const errors: IReflectOperationError[] = [];
    const project = { input: { controllers: [] }, errors, warnings: [] };
    const controller = ReflectControllerAnalyzer.analyze({
      project,
      controller: {
        class: target,
        location: "authored-metadata.ts",
        prefixes: [],
      },
      unique: new WeakSet(),
    });
    assert.ok(controller, "authored class must be recognized as a controller");
    const routes: ITypedHttpRoute[] = [];
    for (const operation of controller.operations) {
      assert.equal(operation.protocol, "http");
      routes.push(
        ...TypedHttpRouteAnalyzer.analyze({
          controller,
          errors,
          operation,
          paths: controller.paths.flatMap((prefix: string) =>
            operation.paths.map(
              (suffix: string) =>
                "/" + [prefix, suffix].filter(Boolean).join("/"),
            ),
          ),
        }),
      );
    }
    return { routes, errors };
  };

  /**
   * Rejects invalid setup rather than allowing an empty document to satisfy
   * assertions.
   */
  export const routes = (target: Function): ITypedHttpRoute[] => {
    const result = analyze(target);
    assert.deepEqual(
      result.errors,
      [],
      "authored route metadata must be valid",
    );
    assert.ok(
      result.routes.length > 0,
      "authored controller must produce routes",
    );
    return result.routes;
  };

  /**
   * Composes over the same retained route/configuration inputs on each
   * invocation.
   */
  export const compose = async (
    routes: ITypedHttpRoute[],
    config: Omit<INestiaConfig.ISwaggerConfig, "output">,
  ): Promise<OpenApi.IDocument> => {
    const { SwaggerGenerator } = load("generates/SwaggerGenerator");
    return SwaggerGenerator.compose({
      config,
      routes,
      document: await SwaggerGenerator.initialize(config),
    });
  };

  /**
   * Locates the requested operation and returns its parameters, including an
   * empty list.
   */
  export const parameters = (
    document: OpenApi.IDocument,
    route: string,
    method: "get" | "post",
  ): OpenApi.IOperation.IParameter[] => {
    const operation = document.paths?.[route]?.[method];
    assert.ok(operation, `${method} ${route} operation must exist`);
    return operation.parameters ?? [];
  };

  /** Compares JSON objects without depending on object-key insertion order. */
  export const canonical = (value: unknown): string =>
    JSON.stringify(value, (_key, member) =>
      typeof member === "object" && member !== null && !Array.isArray(member)
        ? Object.fromEntries(
            Object.keys(member)
              .sort()
              .map((key) => [key, member[key]]),
          )
        : member,
    );

  export type IParameter = OpenApi.IOperation.IParameter;
}
