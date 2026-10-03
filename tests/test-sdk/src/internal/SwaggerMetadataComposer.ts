import { PATH_METADATA } from "@nestjs/common/constants";
import { OpenApi } from "@typia/interface";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import { INestiaConfig } from "../../../../packages/sdk/lib/INestiaConfig";
import { ReflectHttpOperationAnalyzer } from "../../../../packages/sdk/lib/analyses/ReflectHttpOperationAnalyzer";
import { TypedHttpRouteAnalyzer } from "../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer";
import { SwaggerGenerator } from "../../../../packages/sdk/lib/generates/SwaggerGenerator";
import { IOperationMetadata } from "../../../../packages/sdk/lib/structures/IOperationMetadata";
import { IReflectController } from "../../../../packages/sdk/lib/structures/IReflectController";
import { IReflectOperationError } from "../../../../packages/sdk/lib/structures/IReflectOperationError";
import { ITypedHttpRoute } from "../../../../packages/sdk/lib/structures/ITypedHttpRoute";

/**
 * Composes caller-authored operation metadata through the owning SDK analyses.
 *
 * These reflection and document decisions need neither a Nest application nor a
 * compiler: the caller registers its explicit input on ordinary decorators.
 * Each invocation owns diagnostics, analyzed routes and a fresh document file
 * in its unique temporary directory, removed in finally.
 *
 * @evidence contracts/common.md#principled-implementation Actual reflected operation analysis, typed route analysis and Swagger initialization/composition consume the caller's decorated class and authored operation metadata. Missing routes or diagnostics fail instead of returning a vacuous document.
 * @evidence contracts/common.md#clear-and-simple-design One helper crosses the portable reflection, type-record and composition owners in order. Individual unit cases retain their distinct expected schemas, mutations and options.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No application, resolver override, compiler, installation or generated input is substituted. Metadata is explicitly authored by the case and passed to the actual built analyses.
 * @evidence contracts/common.md#meaningful-documentation The comment states the direct metadata boundary and why host preparation is unnecessary; required method names and errors are checked visibly.
 * @evidence contracts/portability.md#os-neutral-implementation Node path.join and OS temporary roots own the UTF-8 document pathname; router paths retain slash-separated protocol spelling. Recursive cleanup targets only this invocation's mkdtemp result, never a shared directory.
 * @evidence contracts/performance.md#efficient-algorithms Each declared method is reflected and analyzed once; one generator call composes all supplied routes into a single document. No compiler or host is prepared.
 * @evidence contracts/performance.md#reuse-equivalent-work A case controls the unchanged decorated class, metadata and configuration across its repeated compositions. Fresh document generation intentionally retains the isolation transition rather than reusing an edited result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local diagnostics and routes last for one composition; its unique output directory is removed in finally after generation/read success or failure. No process or application handles are acquired.
 */
export const SwaggerMetadataComposer = async (
  target: Function,
  methods: string[],
  config: Omit<INestiaConfig.ISwaggerConfig, "output">,
) => {
  const controller: IReflectController = {
    class: target,
    prefixes: [],
    paths: [Reflect.getMetadata(PATH_METADATA, target)],
    file: "authored-metadata-controller.ts",
    versions: undefined,
    operations: [],
    security: [],
    tags: [],
  };
  const errors: IReflectOperationError[] = [];
  const warnings: IReflectOperationError[] = [];
  const routes: ITypedHttpRoute[] = [];
  for (const name of methods) {
    const operation = ReflectHttpOperationAnalyzer.analyze({
      project: { input: { controllers: [] }, errors, warnings },
      controller,
      function: target.prototype[name],
      name,
      metadata: Reflect.getMetadata(
        "nestia/OperationMetadata",
        target.prototype,
        name,
      ) as IOperationMetadata,
    });
    assert(operation, `No authored operation: ${name}`);
    routes.push(
      ...TypedHttpRouteAnalyzer.analyze({
        controller,
        operation,
        errors,
        paths: operation.paths.map(
          (part) =>
            "/" +
            [controller.paths[0], part]
              .join("/")
              .split("/")
              .filter(Boolean)
              .join("/"),
        ),
      }),
    );
  }
  assert.deepEqual(errors, []);
  assert.equal(routes.length, methods.length);
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-swagger-metadata-"),
  );
  const output = path.join(directory, "swagger.json");
  try {
    await SwaggerGenerator.generate({
      project: {
        config: { input: [], swagger: { ...config, output } },
        input: { controllers: [] },
        errors,
        warnings,
      },
      collection: {
        objects: new Map(),
        aliases: new Map(),
        arrays: new Map(),
        tuples: new Map(),
      },
      routes,
    });
    return JSON.parse(fs.readFileSync(output, "utf8")) as OpenApi.IDocument;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
