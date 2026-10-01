import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("first")
class FirstController {
  @Get()
  public get(@Query() _query: object): void {}
}
@Controller("second")
class SecondController {
  @Get()
  public get(@Query() _query: object): void {}
}
@Controller("equivalent")
class EquivalentController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies clone dictionaries distinguish conflicting names and reuse
 * equivalent definitions.
 *
 * Separate producer inputs can legally describe different objects under one
 * original type name. Their portable collection and writer decisions must
 * preserve each definition and update its importing route consistently.
 *
 * 1. Analyze three authored controllers with number/string/number query objects.
 * 2. Build one route dictionary and generate their cloned declarations.
 * 3. Assert both distinct definitions and all three corresponding type/import
 *    references.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual routeDictionary retains two definitions from three conflicting-name inputs, CloneGenerator emits number and string namespace declarations, and every route refers to the correct generated type and module.
 * @evidence contracts/testing.md#independent-expectations Authored atomic kinds determine the two different property types; equivalent number definitions share one clone. Controller-qualified names disambiguate the differing definitions according to the documented collision policy, independently of current output.
 * @evidence contracts/testing.md#distinguishing-cases Number versus string differs by one property type; the third number definition is the equivalent reuse control. Dictionary size, declaration property type and per-route references distinguish lost definitions, unnecessary copies and stale imports.
 * @evidence contracts/testing.md#execution-ownership The test-sdk entry discovers this export and directly invokes reflection, typed-route dictionary and clone writer owners over authored metadata. One owned output directory is released in finally; no native producer, consumer compilation, application or process protocol starts.
 */
export const test_sdk_clone_component_name_collisions =
  async (): Promise<void> => {
    const routes = [
      FirstController,
      SecondController,
      EquivalentController,
    ].flatMap((controller, index) => {
      const metadata = HandWrittenMetadata.operation({
        baked: false,
        members: [],
      });
      for (const pipe of [
        metadata.parameters[0]?.primitive,
        metadata.parameters[0]?.resolved,
      ]) {
        assert.ok(pipe);
        const property = pipe.data.components.objects[0]?.properties[0];
        assert.ok(property);
        property.value.atomics = [
          { type: index === 1 ? "string" : "number", tags: [] },
        ];
      }
      Reflect.defineMetadata(
        "nestia/OperationMetadata",
        metadata,
        controller.prototype,
        "get",
      );
      return SwaggerCompositionHarness.routes(controller);
    });
    const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
    const { TypedHttpRouteAnalyzer } = require(
      path.join(sdk, "analyses/TypedHttpRouteAnalyzer"),
    ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
    const { CloneGenerator } = require(
      path.join(sdk, "generates/CloneGenerator"),
    ) as typeof import("../../../../../packages/sdk/lib/generates/CloneGenerator");
    const collection = TypedHttpRouteAnalyzer.routeDictionary(routes);
    assert.deepEqual([...collection.objects.keys()].sort(), [
      "FirstController.IFallbackQuery",
      "SecondController.IFallbackQuery",
    ]);
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "nestia-clone-collisions-"),
    );
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
      for (const [controller, kind] of [
        ["FirstController", "number"],
        ["SecondController", "string"],
      ] as const) {
        const source = fs.readFileSync(
          path.join(root, "structures", `${controller}.ts`),
          "utf8",
        );
        assert.ok(source.includes(`export namespace ${controller}`), source);
        assert.ok(source.includes("export type IFallbackQuery"), source);
        assert.ok(source.includes(`visible: ${kind};`), source);
      }
      for (const [index, route] of routes.entries()) {
        const controller = index === 1 ? "SecondController" : "FirstController";
        assert.equal(
          route.queryObject?.type.name,
          `${controller}.IFallbackQuery`,
        );
        assert.ok(
          route.imports.some(
            (entry) =>
              entry.file === `${root}/structures/${controller}` &&
              entry.elements.includes(controller),
          ),
        );
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
