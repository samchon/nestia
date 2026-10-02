import {
  IHttpMigrateApplication,
  IHttpMigrateRoute,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import type { IValidation } from "@typia/interface";
import { HttpMigration, OpenApiConverter } from "@typia/utils";
import { TreeSet } from "tstl";

import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { NestiaMigrateApiProgrammer } from "./programmers/NestiaMigrateApiProgrammer";
import { NestiaMigrateApiStartProgrammer } from "./programmers/NestiaMigrateApiStartProgrammer";
import { NestiaMigrateE2eProgrammer } from "./programmers/NestiaMigrateE2eProgrammer";
import { NestiaMigrateNestProgrammer } from "./programmers/NestiaMigrateNestProgrammer";
import { INestiaMigrateConfig } from "./structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "./structures/INestiaMigrateContext";

/**
 * Converts an OpenAPI document into a NestJS project or an SDK project, as a
 * map from file path to file content.
 *
 * The constructor analyzes an emended OpenAPI document once; `assert` and
 * `validate` upgrade a document of any supported version to that form first.
 * `nest` and `sdk` then compose the files of the bundled template with the
 * generated ones.
 *
 * The constructor analyzes the document once; generation walks templates and
 * delegates per-route/schema emission, with the context builder’s accessor trie
 * indexing strict prefixes.
 *
 * The instance shares its analyzed application between nest and sdk calls.
 * Generation creates fresh context/accessor copies because its mode and config
 * can differ.
 *
 * One instance retains its original document and analysis until callers release
 * it; generated file maps are returned to callers rather than accumulated on
 * the instance.
 *
 * @evidence contracts/common.md#principled-implementation The constructor analyzes the emended document into routes with `HttpMigration`, and the two generators start from the bundled template files, drop the paths the generators own (structures, functional API, controllers, feature tests), and add the generated files, so the result is the template with those trees replaced.
 * @evidence contracts/common.md#clear-and-simple-design One class with two generators sharing one context builder; the accessor conflict escape and the package renaming are module-private functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Route analysis and the OpenAPI upgrade come from `@typia/utils`, and no document, path, or type name is special-cased; QUERY-method routes are left out because the SDK has no representation for them.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the class produces, when the document is analyzed, and how the two generators use the template.
 */
export class NestiaMigrateApplication {
  private readonly data_: IHttpMigrateApplication;

  /* -----------------------------------------------------------
    CONSTRUCTORS
  ----------------------------------------------------------- */
  public constructor(public readonly document: OpenApi.IDocument) {
    this.data_ = HttpMigration.application(document);
  }

  /**
   * Creates the application from a document of any supported OpenAPI or Swagger
   * version, and throws when the document cannot be upgraded.
   *
   * Version conversion and route analysis scale with the document’s routes and
   * schemas; this wrapper delegates each once.
   *
   * @evidence contracts/common.md#principled-implementation The document is upgraded by `OpenApiConverter.upgradeDocument`, which owns the version differences, so this function only wraps a successful result.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not repair or guess invalid documents.
   * @evidence contracts/common.md#meaningful-documentation The comment states the accepted versions and the throwing behavior.
   */
  public static assert(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument
      | OpenApi.IDocument,
  ): NestiaMigrateApplication {
    return new NestiaMigrateApplication(
      OpenApiConverter.upgradeDocument(document),
    );
  }

  /**
   * Creates the application, or returns the failure as an `IValidation` instead
   * of throwing.
   *
   * Version conversion and route analysis scale with the document’s routes and
   * schemas; validation delegates once and formats one caught failure.
   *
   * @evidence contracts/common.md#principled-implementation The upgrade runs inside a `try`, and an error becomes one validation error whose path is the input and whose value is the message, so a caller can report it.
   * @evidence contracts/common.md#clear-and-simple-design The non-throwing twin of `assert`, sharing its constructor call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The failure is reported, not hidden, and the message is the original one.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result shape.
   */
  public static validate(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument
      | OpenApi.IDocument,
  ): IValidation<NestiaMigrateApplication> {
    try {
      return {
        success: true,
        data: new NestiaMigrateApplication(
          OpenApiConverter.upgradeDocument(document),
        ),
      };
    } catch (exp) {
      const message: string = exp instanceof Error ? exp.message : String(exp);
      return {
        success: false,
        data: document,
        errors: [
          {
            path: "$input",
            expected:
              "SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument | OpenApiV3_2.IDocument | OpenApi.IDocument",
            value: message,
          },
        ],
      };
    }
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  /**
   * Returns the analyzed application: the routes and the operations that could
   * not be migrated.
   *
   * Returning the existing analysis reference uses constant work.
   *
   * The constructor’s analysis is returned directly to every caller; callers
   * receive mutable shared state rather than an independently refreshed view.
   *
   * @evidence contracts/common.md#principled-implementation The analysis is done once in the constructor and returned by reference.
   * @evidence contracts/common.md#clear-and-simple-design One accessor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It exposes what the analysis produced.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is returned.
   */
  public getData(): IHttpMigrateApplication {
    return this.data_;
  }

  /**
   * Generates a NestJS monorepo project from the document.
   *
   * The files are the template, the controllers, the module, the DTO
   * structures, the functional API, and, when requested, the e2e tests. A
   * package name replaces the placeholder in every file.
   *
   * Template filtering and renaming scale with template/output bytes;
   * programmers traverse routes and schemas. Accessor conflict escape indexes R
   * routes with at most D segments in a trie. Ordered terminal sets preserve
   * first-route precedence with logarithmic updates, and each escape probes
   * only the current D-segment path rather than scanning R routes. Trie state
   * holds original/final prefixes only and is local to generation.
   *
   * The instance’s route analysis is reused. Each call recomputes
   * mode/config-dependent output and copies accessors because conflict escaping
   * mutates them; returned maps remain caller-owned.
   *
   * @evidence contracts/common.md#principled-implementation The context copies the routes and escapes accessors that would collide with a shorter accessor, the template entries of the generated trees are removed, the programmers write the replacements, and `keyword: false` rewrites the one template setting that selects keyword parameters.
   * @evidence contracts/common.md#clear-and-simple-design One method that composes the generators; each generator owns its own files.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The template is the published starter, and the only textual edit of it is the documented keyword setting.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is generated and the package renaming.
   */
  public nest(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "nest",
      this.data_,
      config,
    );
    const files: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(NEST_TEMPLATE).filter(
          ([key]) =>
            key.startsWith("packages/api/src/structures") === false &&
            key.startsWith("packages/api/src/functional") === false &&
            key.startsWith("packages/backend/src/controllers") === false &&
            key.startsWith("packages/backend/test/features") === false,
        ),
      ),
      ...NestiaMigrateNestProgrammer.write(context),
      ...NestiaMigrateApiProgrammer.write(context),
      ...(config.e2e ? NestiaMigrateE2eProgrammer.write(context) : {}),
      ...(config.keyword === false
        ? {
            "packages/backend/nestia.config.ts": NEST_TEMPLATE[
              "packages/backend/nestia.config.ts"
            ]!.replace("keyword: true", "keyword: false"),
          }
        : {}),
    };
    return config.package ? renameSlug(config.package, files) : files;
  }

  /**
   * Generates an SDK project from the document.
   *
   * The files are the template, the DTO structures, the functional API, the
   * start script, the swagger document in its emended form, and, when
   * requested, the e2e tests. A package name replaces the placeholder in every
   * file.
   *
   * Template filtering and renaming scale with template/output bytes;
   * programmers traverse routes and schemas. Accessor conflict escape indexes R
   * routes with at most D segments in a trie. Ordered terminal sets preserve
   * first-route precedence with logarithmic updates, and each escape probes
   * only the current D-segment path rather than scanning R routes. Trie state
   * holds original/final prefixes only and is local to generation.
   *
   * The instance’s route analysis is reused; mode/config-dependent output is
   * recomputed with fresh accessor copies, and returned maps remain
   * caller-owned.
   *
   * @evidence contracts/common.md#principled-implementation The context is built as for `nest`, the template entries of the generated trees are removed, the programmers write the replacements, and the emended document the application was built from, which is the input after any upgrade, is written beside them as `swagger.json`.
   * @evidence contracts/common.md#clear-and-simple-design One method that composes the generators, sharing the context builder with `nest`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The template is the published starter, and no document is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is generated and the package renaming.
   */
  public sdk(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "sdk",
      this.data_,
      config,
    );
    const files: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(SDK_TEMPLATE).filter(
          ([key]) =>
            key.startsWith("src/structures") === false &&
            key.startsWith("src/functional") === false &&
            key.startsWith("test/features") === false,
        ),
      ),
      ...NestiaMigrateApiProgrammer.write(context),
      ...NestiaMigrateApiStartProgrammer.write(context),
      ...(config.e2e ? NestiaMigrateE2eProgrammer.write(context) : {}),
      "swagger.json": JSON.stringify(this.document, null, 2),
    };
    return config.package ? renameSlug(config.package, files) : files;
  }
}

const createContext = (
  mode: "nest" | "sdk",
  application: IHttpMigrateApplication,
  config: INestiaMigrateConfig,
): INestiaMigrateContext => {
  const routes: IHttpMigrateRoute[] = escapeConflictingAccessors(
    application.routes
      .filter((r) => r.method !== "query")
      .map((r) => ({
        ...r,
        accessor: [...r.accessor],
      })),
  );
  return {
    mode,
    application: {
      ...application,
      routes,
    },
    config,
  };
};

const escapeConflictingAccessors = (
  routes: IHttpMigrateRoute[],
): IHttpMigrateRoute[] => {
  type Prefix = {
    children: Map<string, Prefix>;
    terminal: TreeSet<number>;
  };
  const create = (): Prefix => ({
    children: new Map(),
    terminal: new TreeSet(),
  });
  const root: Prefix = create();
  const insert = (accessor: string[], index: number): Prefix => {
    let node = root;
    for (const segment of accessor) {
      let child = node.children.get(segment);
      if (child === undefined) {
        child = create();
        node.children.set(segment, child);
      }
      node = child;
    }
    node.terminal.insert(index);
    return node;
  };
  const terminals = routes.map((route, index) => insert(route.accessor, index));
  for (const [routeIndex, route] of routes.entries()) {
    while (true) {
      let node = root;
      let neighborIndex = Infinity;
      for (let depth = 0; depth < route.accessor.length - 1; ++depth) {
        const child = node.children.get(route.accessor[depth]!);
        if (child === undefined) break;
        node = child;
        if (!node.terminal.empty())
          neighborIndex = Math.min(neighborIndex, node.terminal.begin().value);
      }
      if (neighborIndex === Infinity) break;
      const conflict = routes[neighborIndex]!.accessor.length - 1;
      route.accessor[conflict] = `_${route.accessor[conflict]}`;
    }
    terminals[routeIndex]!.terminal.erase(routeIndex);
    insert(route.accessor, routeIndex);
  }
  return routes;
};

const renameSlug = (
  slug: string,
  files: Record<string, string>,
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(files).map(([key, value]) => [
      key,
      value.split(`@ORGANIZATION/PROJECT`).join(slug),
    ]),
  );
};
