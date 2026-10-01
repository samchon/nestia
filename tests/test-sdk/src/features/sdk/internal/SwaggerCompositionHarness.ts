import type { INestiaConfig } from "@nestia/sdk";
import assert from "assert/strict";
import path from "path";
import type { OpenApi } from "typia";

import type { IReflectOperationError } from "../../../../../../packages/sdk/lib/structures/IReflectOperationError";
import type { ITypedHttpRoute } from "../../../../../../packages/sdk/lib/structures/ITypedHttpRoute";

/**
 * Direct owners for authored metadata cases; no application graph is
 * fabricated.
 *
 * @evidence contracts/common.md#principled-implementation The namespace retains actual route analysis, diagnostics and fresh document composition rather than fabricating an application graph.
 * @evidence contracts/common.md#clear-and-simple-design Analysis, positive-setup guards, composition and comparison helpers expose distinct responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The namespace groups maintained declarations and adds no expected-output behavior or foreign mutation.
 * @evidence contracts/common.md#meaningful-documentation Direct reflection, typed-route and Swagger composition for authored metadata.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups declarations; individual functions own their processing algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no completed or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained history, handles or running tasks.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The namespace groups declarations; its native loader accessors own filesystem path resolution.
 */
export namespace SwaggerCompositionHarness {
  /** Loads the requested built SDK owner relative to the workspace. */
  const load = (file: string) =>
    require(path.resolve(process.cwd(), "../../packages/sdk/lib", file));

  /**
   * Returns typed routes and the actual analysis errors for one authored
   * controller.
   *
   * @evidence contracts/common.md#principled-implementation Controller reflection identifies real Nest metadata; typed HTTP analysis receives its actual operations and paths, and both errors and routes are retained.
   * @evidence contracts/common.md#clear-and-simple-design One shared project error collection joins the two analysis stages without constructing an application container.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper invokes actual package owners and rejects unrecognized controllers instead of fabricating routes.
   * @evidence contracts/common.md#meaningful-documentation Analyzes an authored controller through the actual reflection and typed-route owners.
   * @evidence contracts/portability.md#os-neutral-implementation The delegated loader resolves the built SDK directory through Node path.resolve and require; reflected route paths are logical HTTP strings rather than native filesystem paths.
   * @evidence contracts/performance.md#efficient-algorithms The helper traverses reflected operations and each controller/operation path product once; SDK analysis owns metadata processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
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
   *
   * @evidence contracts/common.md#principled-implementation Empty routes or analysis errors are rejected before composition so vacuous documents cannot satisfy positive assertions.
   * @evidence contracts/common.md#clear-and-simple-design One call to analyze supplies both route and diagnostic controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Setup failures propagate as assertions rather than being swallowed or translated into empty success.
   * @evidence contracts/common.md#meaningful-documentation Returns nonempty valid routes and rejects invalid authored setup.
   * @evidence contracts/portability.md#os-neutral-implementation Route analysis delegates to analyze, whose built-module loader uses Node native path resolution without shell commands.
   * @evidence contracts/performance.md#efficient-algorithms The helper invokes analysis once, then checks its diagnostics and route count.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
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
   *
   * @evidence contracts/common.md#principled-implementation Actual generator initialization and composition determine output while the caller retains the same authored inputs.
   * @evidence contracts/common.md#clear-and-simple-design One initialization result feeds one composition call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No generator output or callback is replaced, and no Nest host is constructed.
   * @evidence contracts/common.md#meaningful-documentation Composes Swagger using retained routes and configuration with a fresh initialized document.
   * @evidence contracts/portability.md#os-neutral-implementation The delegated loader uses Node path.resolve and require to reach the caller-built generator without shell commands or platform-specific executable spellings.
   * @evidence contracts/performance.md#efficient-algorithms Each request initializes and composes once; document generation cost remains with the actual Swagger owners.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
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
   *
   * @evidence contracts/common.md#principled-implementation The operation must exist; only a present operation with absent parameters returns an empty list.
   * @evidence contracts/common.md#clear-and-simple-design One path/method lookup exposes the distinction between absent operation and empty parameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An assertion prevents a missing operation from becoming a successful empty result.
   * @evidence contracts/common.md#meaningful-documentation Returns parameters from an existing requested operation.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration works with in-memory values; the file's native module loader owns filesystem path resolution.
   * @evidence contracts/performance.md#efficient-algorithms The operation lookup and empty-list fallback require constant structural work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
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

  /**
   * Compares JSON objects without depending on object-key insertion order.
   *
   * @evidence contracts/common.md#principled-implementation Sorted object keys remove insertion-order differences while array element order remains semantically meaningful.
   * @evidence contracts/common.md#clear-and-simple-design A JSON replacer handles object ordering in one serialization traversal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper normalizes structure only and does not remove differing values or members.
   * @evidence contracts/common.md#meaningful-documentation Serializes JSON values after sorting object keys while preserving array order.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration works with in-memory values; the file's native module loader owns filesystem path resolution.
   * @evidence contracts/performance.md#efficient-algorithms Each object sorts its own keys in O(K log K); traversal and result storage scale with the serialized value.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
   */
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

  /**
   * Shares the actual OpenAPI parameter representation with authored cases.
   *
   * @evidence contracts/common.md#principled-implementation The alias preserves the dependency's parameter type without narrowing supported fields.
   * @evidence contracts/common.md#clear-and-simple-design One alias avoids a duplicate schema definition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No substitute representation or runtime implementation is introduced.
   * @evidence contracts/common.md#meaningful-documentation Shares the actual OpenAPI parameter representation with authored cases.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration works with in-memory values; the file's native module loader owns filesystem path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The representation declares values and chooses no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; returned values belong to its caller.
   */
  export type IParameter = OpenApi.IOperation.IParameter;
}
