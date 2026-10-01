import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import type {
  MetadataAliasType,
  MetadataObjectType,
  MetadataSchema,
} from "../../../../../packages/sdk/lib/internal/legacy";
import type { ITypedHttpRoute } from "../../../../../packages/sdk/lib/structures/ITypedHttpRoute";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("slots")
class SlotsController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies named objects and aliases retain their distinct declaration slots.
 *
 * The clone module tree has one writer per accessor path, although metadata
 * stores object and alias definitions in separate maps. Distinct same-name
 * declarations must therefore be renamed before the writer registers them.
 * Arrays and tuples have inline expressions and occupy no declaration slot.
 *
 * 1. Author same-name object, alias, array and tuple forms independently.
 * 2. Build the actual dictionary and clone files through their owning operations.
 * 3. Check both distinct declarations and adjacent inline/equivalent controls.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual routeDictionary and CloneGenerator retain an object and a distinct same-name alias in separate emitted namespaces and rewrite each route/import consistently; inline arrays/tuples and equivalent aliases retain their own meanings.
 * @evidence contracts/testing.md#independent-expectations Authored number-valued objects and string aliases require different TypeScript declarations; number arrays and tuples require inline syntax without their own named declarations. Equivalent aliases require one shared declaration.
 * @evidence contracts/testing.md#distinguishing-cases Object versus alias pins the shared declaration slot, object versus array/tuple pins inline forms, and two equivalent aliases reject needless splitting. The generated text and route names expose overwritten declarations.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered by test-sdk. Authored metadata calls direct dictionary and file writer operations using a caller-owned temporary directory cleaned in finally, without installation, product fixture compilation or hosts.
 */
export const test_sdk_clone_declaration_slots = async (): Promise<void> => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { TypedHttpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedHttpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
  const { CloneGenerator } = require(
    path.join(sdk, "generates/CloneGenerator"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/CloneGenerator");
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    HandWrittenMetadata.operation({ baked: false, members: [] }),
    SlotsController.prototype,
    "get",
  );
  const original = SwaggerCompositionHarness.routes(SlotsController)[0]!;
  const originalObject = original.queryObject!.metadata.objects[0]!
    .type as MetadataObjectType;
  const empty = (): MetadataSchema => ({
    ...structuredClone(originalObject.properties[0]!.value),
    atomics: [],
  });
  const number = (): MetadataSchema => ({
    ...empty(),
    atomics: [{ type: "number", tags: [] }],
  });
  const alias = (): MetadataAliasType => ({
    name: "Shared",
    value: { ...empty(), atomics: [{ type: "string", tags: [] }] },
    description: null,
    jsDocTags: [],
    recursive: false,
    nullables: [false],
  });
  for (const kind of [
    "alias",
    "accessor-collision",
    "array",
    "tuple",
    "equivalent-alias",
  ] as const) {
    const object = {
      ...structuredClone(originalObject),
      name: kind === "accessor-collision" ? "Shared-o1" : "Shared",
      description: undefined,
    };
    const first: MetadataSchema =
      kind === "equivalent-alias"
        ? { ...empty(), aliases: [{ name: "Shared", tags: [], type: alias() }] }
        : { ...empty(), objects: [{ name: "Shared", tags: [], type: object }] };
    const second: MetadataSchema =
      kind === "alias" ||
      kind === "accessor-collision" ||
      kind === "equivalent-alias"
        ? {
            ...empty(),
            aliases: [
              {
                name: "Shared",
                tags: [],
                type: {
                  ...alias(),
                  name: kind === "accessor-collision" ? "Shared.o1" : "Shared",
                },
              },
            ],
          }
        : kind === "array"
          ? {
              ...empty(),
              arrays: [
                {
                  name: "Shared",
                  tags: [],
                  type: {
                    name: "Shared",
                    value: number(),
                    index: 0,
                    recursive: false,
                    nullables: [false],
                  },
                },
              ],
            }
          : {
              ...empty(),
              tuples: [
                {
                  name: "Shared",
                  tags: [],
                  type: {
                    name: "Shared",
                    elements: [number()],
                    index: 0,
                    recursive: false,
                    nullables: [false],
                  },
                },
              ],
            };
    const routes: ITypedHttpRoute[] = [first, second].map(
      (metadata, index) => ({
        ...original,
        imports: [],
        controller: {
          ...original.controller,
          class: {
            ...original.controller.class,
            name: index ? "AliasOwner" : "ObjectOwner",
          },
        },
        queryObject: {
          ...original.queryObject!,
          metadata,
          type: { name: "stale" },
        },
      }),
    );
    const collection = TypedHttpRouteAnalyzer.routeDictionary(routes);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-clone-slots-"));
    try {
      await CloneGenerator.write({
        project: {
          config: { input: [], output: root, clone: true },
          input: { controllers: [] },
          errors: [],
          warnings: [],
        },
        collection,
        routes,
      });
      const sources = fs
        .readdirSync(path.join(root, "structures"))
        .map((file) =>
          fs.readFileSync(path.join(root, "structures", file), "utf8"),
        )
        .join("\n");
      if (kind === "alias" || kind === "accessor-collision") {
        assert.match(sources, /export namespace ObjectOwner/);
        assert.match(sources, /visible:\s*number/);
        assert.match(sources, /export namespace AliasOwner/);
        assert.match(
          sources,
          kind === "alias"
            ? /export type Shared = string/
            : /export type o1 = string/,
        );
        assert.equal(
          routes[0]!.queryObject!.type.name,
          kind === "alias" ? "ObjectOwner.Shared" : "ObjectOwner.Shared.o1",
        );
        assert.equal(
          routes[1]!.queryObject!.type.name,
          kind === "alias" ? "AliasOwner.Shared" : "AliasOwner.Shared.o1",
        );
        for (const [index, owner] of ["ObjectOwner", "AliasOwner"].entries())
          assert.ok(
            routes[index]!.imports.some((entry) =>
              entry.elements.includes(owner),
            ),
          );
      } else if (kind === "equivalent-alias") {
        assert.equal(collection.aliases.size, 1);
        assert.equal(routes[0]!.queryObject!.type.name, "Shared");
        assert.equal(routes[1]!.queryObject!.type.name, "Shared");
        assert.match(sources, /export type Shared = string/);
      } else {
        assert.equal(collection.objects.size, 1);
        assert.equal(routes[0]!.queryObject!.type.name, "Shared");
        assert.equal(
          routes[1]!.queryObject!.type.name,
          kind === "array" ? "number[]" : "[number]",
        );
        assert.match(sources, /visible:\s*number/);
        assert.equal(fs.readdirSync(path.join(root, "structures")).length, 1);
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
};
