import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import path from "path";

import type {
  IReflectMetadata,
  MetadataObjectType,
  MetadataSchema,
} from "../../../../../packages/sdk/lib/internal/legacy";
import type { ITypedHttpRoute } from "../../../../../packages/sdk/lib/structures/ITypedHttpRoute";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("structural")
class StructuralController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies cloned route expressions and imports come from resolved structures.
 *
 * A pre-baked name cannot follow a renamed component or describe namespace
 * imports nested in arrays, tuples and unions. The declaration writer must
 * retain the same structural type when it supplies a route's expression.
 *
 * 1. Supply authored object, alias, array, tuple, union and tagged metadata.
 * 2. Invoke the clone referencer and inspect exact type expressions and imports.
 * 3. Preserve empty and unknown keyword boundaries and import aliases.
 *
 * @evidence contracts/testing.md#behavioral-verification SdkHttpCloneReferencer.replace emits resolved object/alias names through nullable, array, tuple, union and tag forms, registers actual namespace/tag imports, preserves empty and unknown keywords, and ImportDictionary retains aliased/default/namespace bindings.
 * @evidence contracts/testing.md#independent-expectations Literal TypeScript expressions follow authored schemas: optional tuple syntax, null/number unions and Minimum<3> are independently specified. Resolved namespace definitions require their root binding; typia tags require tags from typia. Local versus exported alias direction comes from import syntax.
 * @evidence contracts/testing.md#distinguishing-cases Stale baked names distinguish structural emission. Object versus alias, nested arrays/tuples, nullable versus required, union versus sole type, tagged versus plain, void/never/unknown/any boundaries and renamed versus identity imports pin distinct decisions.
 * @evidence contracts/testing.md#execution-ownership The test-sdk entry discovers this matching sole export. Authored metadata calls direct reflection, clone referencer and import registration owners without consumer installation, product compilation, host or filesystem outputs. The collision case owns actual CloneGenerator namespace file emission; clone false selection remains in the SDK generation/E2E owner.
 */
export const test_sdk_clone_route_structural_types = (): void => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { SdkHttpCloneReferencer } = require(
    path.join(sdk, "generates/internal/SdkHttpCloneReferencer"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/SdkHttpCloneReferencer");
  const { ImportDictionary } = require(
    path.join(sdk, "generates/internal/ImportDictionary"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/ImportDictionary");
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    HandWrittenMetadata.operation({ baked: false, members: [] }),
    StructuralController.prototype,
    "get",
  );
  const original = SwaggerCompositionHarness.routes(StructuralController)[0]!;
  const object = original.queryObject!.metadata.objects[0]!
    .type! as MetadataObjectType;
  object.name = "Canonical.IQuery";
  const empty = (): IReflectMetadata => ({
    ...structuredClone(object.properties[0]!.value),
    atomics: [],
    name: "stale",
    size: 1,
  });
  const named = (): IReflectMetadata => ({
    ...empty(),
    objects: [{ name: "Original", tags: [], type: object }],
  });
  const atom = empty();
  atom.atomics = [{ type: "number", tags: [] }];
  const tagged = structuredClone(atom);
  tagged.atomics[0]!.tags = [
    [
      {
        target: "number",
        name: "Minimum<3>",
        kind: "minimum",
        value: 3,
        exclusive: true,
        validate: "$input >= 3",
        schema: { minimum: 3 },
      },
    ],
  ];
  const cases: Array<{
    metadata: MetadataSchema;
    expected: string;
    imports: string[];
  }> = [
    { metadata: named(), expected: "Canonical.IQuery", imports: ["Canonical"] },
    {
      metadata: { ...named(), nullable: true },
      expected: "null | Canonical.IQuery",
      imports: ["Canonical"],
    },
    {
      metadata: { ...named(), required: false },
      expected: "undefined | Canonical.IQuery",
      imports: ["Canonical"],
    },
    {
      metadata: { ...named(), atomics: atom.atomics },
      expected: "number | Canonical.IQuery",
      imports: ["Canonical"],
    },
    {
      metadata: {
        ...empty(),
        arrays: [
          {
            name: "Array",
            tags: [],
            type: {
              name: "Array",
              value: named(),
              recursive: false,
              nullables: [false],
              index: 1,
            },
          },
        ],
      },
      expected: "Canonical.IQuery[]",
      imports: ["Canonical"],
    },
    {
      metadata: {
        ...empty(),
        tuples: [
          {
            name: "Tuple",
            tags: [],
            type: {
              name: "Tuple",
              elements: [named(), { ...named(), optional: true }],
              recursive: false,
              nullables: [false],
              index: 1,
            },
          },
        ],
      },
      expected: "[Canonical.IQuery, Canonical.IQuery?]",
      imports: ["Canonical"],
    },
    {
      metadata: {
        ...empty(),
        aliases: [
          {
            name: "OldAlias",
            tags: [],
            type: {
              name: "Canonical.Alias",
              value: named(),
              recursive: false,
              description: null,
              jsDocTags: [],
              nullables: [false],
            },
          },
        ],
      },
      expected: "Canonical.Alias",
      imports: ["Canonical"],
    },
    {
      metadata: tagged,
      expected: "number & tags.Minimum<3>",
      imports: ["tags"],
    },
    ...["void", "undefined", "never", "unknown", "any"].map((name) => ({
      metadata: {
        ...empty(),
        required: name !== "void" && name !== "undefined",
        any: name === "unknown" || name === "any",
        name,
        size: 0,
      },
      expected: name,
      imports: [],
    })),
  ];
  for (const scenario of cases) {
    const route: ITypedHttpRoute = {
      ...original,
      imports: [],
      queryObject: {
        ...original.queryObject!,
        metadata: scenario.metadata,
        type: { name: "stale" },
      },
      success: { ...original.success, type: { name: "void" } },
    };
    SdkHttpCloneReferencer.replace({
      project: {
        config: {
          input: [],
          output: path.resolve("clone-route-output"),
          clone: true,
        },
        input: { controllers: [] },
        errors: [],
        warnings: [],
      },
      collection: {
        objects: new Map(),
        aliases: new Map(),
        arrays: new Map(),
        tuples: new Map(),
      },
      routes: [route],
    });
    assert.equal(route.queryObject!.type.name, scenario.expected);
    assert.equal(route.success.type.name, "void");
    assert.deepEqual(
      route.imports.flatMap((entry) => entry.elements).sort(),
      scenario.imports,
    );
    for (const entry of route.imports)
      assert.equal(
        entry.file,
        entry.elements.includes("tags")
          ? "node_modules/typia"
          : path.resolve("clone-route-output/structures/Canonical"),
      );
  }
  const importer = new ImportDictionary(
    path.resolve("clone-route-output/index.ts"),
  );
  importer.internal({
    file: path.resolve("source.ts"),
    type: "element",
    name: "Exported",
    alias: "Local",
    declaration: true,
  });
  importer.internal({
    file: path.resolve("source.ts"),
    type: "element",
    name: "Identity",
    declaration: true,
  });
  importer.external({
    file: "fixture",
    type: "default",
    name: "Default",
    declaration: true,
  });
  importer.external({
    file: "fixture",
    type: "asterisk",
    name: "Namespace",
    declaration: true,
  });
  const imports = importer.toImports();
  assert.deepEqual(
    imports.find((entry) => entry.file === path.resolve("source")),
    {
      file: path.resolve("source"),
      default: null,
      asterisk: null,
      elements: ["Identity", "Local"],
      elementAliases: { Local: "Exported" },
    },
  );
  assert.ok(
    imports.some(
      (entry) =>
        entry.file === "node_modules/fixture" && entry.default === "Default",
    ),
  );
  assert.ok(
    imports.some(
      (entry) =>
        entry.file === "node_modules/fixture" && entry.asterisk === "Namespace",
    ),
  );
};
