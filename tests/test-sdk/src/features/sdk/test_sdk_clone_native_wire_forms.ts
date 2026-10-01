import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import path from "path";

import type {
  MetadataObjectType,
  MetadataSchema,
} from "../../../../../packages/sdk/lib/internal/legacy";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("native")
class NativeController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies clone types preserve resolved natives and follow escaped wire
 * values.
 *
 * Primitive uses a toJSON return value and Date date-time strings, whereas
 * Resolved preserves supported native classes and typed Set/Map members.
 * Original-only components have no emitted binding, and an empty schema is the
 * bottom type rather than a syntactically empty union.
 *
 * 1. Supply authored native, empty, collection and escaped schemas to the writer.
 * 2. Check independently specified TypeScript forms and Date tag imports.
 * 3. Compare escaped-only original reachability with direct-use controls.
 *
 * @evidence contracts/testing.md#behavioral-verification SdkTypeProgrammer emits actual TypeNodes for empty/native unions, typed collections and Date/toJSON wire forms. routeDictionary enrolls escaped returns while preserving originals used independently by another route.
 * @evidence contracts/testing.md#independent-expectations Installed Primitive and Resolved typings define never for empty unions, native references for resolved built-ins, typed Set/Map members, date-time Date strings and toJSON return shapes. Literal expected expressions and component names are authored from those contracts.
 * @evidence contracts/testing.md#distinguishing-cases Empty versus native versus native union, Set versus Map, Date-only versus mixed toJSON originals, escaped-only versus independently reachable originals and omitted versus supplied baked size distinguish each decision.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered by test-sdk and directly calls the built writer, printer, import dictionary and analyzer with authored input; no native producer, installed consumer, product compilation or host is created by the assertions.
 */
export const test_sdk_clone_native_wire_forms = (): void => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { TsPrinter } = require(
    require.resolve("@ttsc/factory", { paths: [sdk] }),
  ) as typeof import("../../../../../packages/sdk/node_modules/@ttsc/factory");
  const { SdkTypeProgrammer } = require(
    path.join(sdk, "generates/internal/SdkTypeProgrammer"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/SdkTypeProgrammer");
  const { ImportDictionary } = require(
    path.join(sdk, "generates/internal/ImportDictionary"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/ImportDictionary");
  const { TypedHttpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedHttpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    HandWrittenMetadata.operation({ baked: false, members: [] }),
    NativeController.prototype,
    "get",
  );
  const original = SwaggerCompositionHarness.routes(NativeController)[0]!;
  const object = original.queryObject!.metadata.objects[0]!
    .type as MetadataObjectType;
  const empty = (): MetadataSchema => ({
    ...structuredClone(object.properties[0]!.value),
    atomics: [],
  });
  const atom = (type: "string" | "number"): MetadataSchema => ({
    ...empty(),
    atomics: [{ type, tags: [] }],
  });
  const native = (...names: string[]): MetadataSchema => ({
    ...empty(),
    natives: names.map((name) => ({ name, tags: [] })),
  });
  const project = {
    config: {
      input: [],
      output: path.resolve("native-wire-output"),
      clone: true,
    },
    input: { controllers: [] },
    errors: [],
    warnings: [],
  };
  const templateAlias = {
    name: "TemplateNumber",
    value: atom("number"),
    description: null,
    jsDocTags: [],
    recursive: false,
    nullables: [false],
  };
  const template: MetadataSchema = {
    ...empty(),
    templates: [
      {
        row: [
          object.properties[0]!.key,
          {
            ...empty(),
            aliases: [
              { name: templateAlias.name, tags: [], type: templateAlias },
            ],
          },
        ],
        tags: [],
      },
    ],
  };
  const cases: Array<{ metadata: MetadataSchema; expected: string }> = [
    { metadata: empty(), expected: "never" },
    ...[
      "ArrayBuffer",
      "SharedArrayBuffer",
      "Uint8Array",
      "DataView",
      "Date",
      "Blob",
      "File",
      "RegExp",
    ].map((name) => ({ metadata: native(name), expected: name })),
    {
      metadata: native("ArrayBuffer", "SharedArrayBuffer"),
      expected: "ArrayBuffer | SharedArrayBuffer",
    },
    {
      metadata: { ...empty(), sets: [{ value: atom("number"), tags: [] }] },
      expected: "Set<number>",
    },
    {
      metadata: {
        ...empty(),
        maps: [{ key: atom("string"), value: atom("number"), tags: [] }],
      },
      expected: "Map<string, number>",
    },
    {
      metadata: {
        ...empty(),
        escaped: { original: native("Date"), returns: atom("string") },
      },
      expected: 'string & tags.Format<"date-time">',
    },
    {
      metadata: {
        ...empty(),
        escaped: {
          original: native("Date", "Uint8Array"),
          returns: atom("number"),
        },
      },
      expected: "number",
    },
    { metadata: template, expected: "`visible${TemplateNumber}`" },
  ];
  for (const scenario of cases) {
    const importer = new ImportDictionary(
      path.join(project.config.output, "route.ts"),
    );
    assert.equal(
      new TsPrinter().print(
        SdkTypeProgrammer.write(project)(importer)(scenario.metadata),
      ),
      scenario.expected,
    );
    assert.equal(
      importer.toImports().some((entry) => entry.elements.includes("tags")),
      scenario.expected.includes("tags.Format"),
    );
  }
  const hidden = {
    ...structuredClone(object),
    name: "OriginalOnly",
    description: undefined,
  };
  hidden.properties[0]!.value = native("ArrayBuffer", "SharedArrayBuffer");
  const wire = {
    ...structuredClone(object),
    name: "WireValue",
    description: undefined,
  };
  const originalSchema = {
    ...empty(),
    objects: [{ name: hidden.name, tags: [], type: hidden }],
  };
  const returnedSchema = {
    ...empty(),
    objects: [{ name: wire.name, tags: [], type: wire }],
  };
  const escaped = {
    ...empty(),
    escaped: { original: originalSchema, returns: returnedSchema },
  };
  const route = (metadata: MetadataSchema) => ({
    ...original,
    queryObject: { ...original.queryObject!, metadata },
  });
  assert.deepEqual(
    [
      ...TypedHttpRouteAnalyzer.routeDictionary([
        route(template),
      ]).aliases.keys(),
    ],
    ["TemplateNumber"],
  );
  assert.deepEqual(
    [
      ...TypedHttpRouteAnalyzer.routeDictionary([
        route(escaped),
      ]).objects.keys(),
    ],
    ["WireValue"],
  );
  assert.deepEqual(
    [
      ...TypedHttpRouteAnalyzer.routeDictionary([
        route(escaped),
        route(originalSchema),
      ]).objects.keys(),
    ].sort(),
    ["OriginalOnly", "WireValue"],
  );
};
