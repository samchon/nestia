import { Controller, Get, Query } from "@nestjs/common";
import { TsPrinter } from "@ttsc/factory";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import type { INestiaProject } from "../../../../../packages/sdk/lib/structures/INestiaProject";
import type { IOperationMetadata } from "../../../../../packages/sdk/lib/structures/IOperationMetadata";
import type { ITypedMcpRoute } from "../../../../../packages/sdk/lib/structures/ITypedMcpRoute";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("http")
class HttpController {
  @Get()
  public get(@Query() _query: object): void {}
}
class FirstController {
  public tool(_input: object): object {
    return {};
  }
}
class SecondController {
  public tool(_input: object): object {
    return {};
  }
}
class EquivalentController {
  public tool(_input: object): object {
    return {};
  }
}

/**
 * Verifies MCP JSON clones retain wire types without server declaration
 * imports.
 *
 * Source default, namespace and re-export bindings are not portable DTO owners.
 * Their already-resolved native JSON graphs must join HTTP collision grouping
 * and supply both cloned declarations and actual MCP namespace TypeNodes.
 *
 * 1. Reflect authored native pipes with three different source binding forms.
 * 2. Clone conflicting and equivalent DTO graphs together with an HTTP route.
 * 3. Check source-only, void, missing and malformed metadata controls.
 *
 * @evidence contracts/testing.md#behavioral-verification Direct reflection, typed analysis, routeDictionary, CloneGenerator and MCP namespace emission remove server imports and retain the independently authored number/string JSON fields and nullable outputs.
 * @evidence contracts/testing.md#independent-expectations Authored number/string field meanings require separate declarations while equal number schemas share one. Default, namespace and aliased source bindings all resolve to the supplied native graph; JSON wire output must retain null and void must have no value.
 * @evidence contracts/testing.md#distinguishing-cases Three source binding forms, unequal and equivalent same-name DTOs, a shared HTTP graph, clone false, no input, void output, absent pipe, failed pipe and an unresolved component distinguish both overmatching and missing clone enrollment. Native pipe bytes are unchanged by resolution and collision naming.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered by test-sdk. Built owning operations consume authored metadata and one finally-cleaned output directory; no installation, compiler, application, transport or additional native analysis runs. Installed native producer/import-free consumer compilation belongs to the shared MCP E2E fixture.
 */
export const test_sdk_mcp_json_clone = async (): Promise<void> => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { ReflectMcpOperationAnalyzer } = require(
    path.join(sdk, "analyses/ReflectMcpOperationAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/ReflectMcpOperationAnalyzer");
  const { TypedMcpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedMcpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedMcpRouteAnalyzer");
  const { TypedHttpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedHttpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
  const { CloneGenerator } = require(
    path.join(sdk, "generates/CloneGenerator"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/CloneGenerator");
  const { SdkMcpRouteProgrammer } = require(
    path.join(sdk, "generates/internal/SdkMcpRouteProgrammer"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/SdkMcpRouteProgrammer");
  const { ImportDictionary } = require(
    path.join(sdk, "generates/internal/ImportDictionary"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/ImportDictionary");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-mcp-json-clone-"));
  try {
    const project: INestiaProject = {
      config: { input: [], output: root, clone: true },
      input: { controllers: [] },
      errors: [],
      warnings: [],
    };
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      HandWrittenMetadata.operation({ baked: false, members: [] }),
      HttpController.prototype,
      "get",
    );
    const http = SwaggerCompositionHarness.routes(HttpController)[0]!;
    const originals: Array<{ metadata: IOperationMetadata; bytes: string }> =
      [];
    const reflected = [
      FirstController,
      SecondController,
      EquivalentController,
    ].map((target, index) => {
      const metadata = HandWrittenMetadata.operation({
        baked: false,
        members: [],
      }) as unknown as IOperationMetadata;
      assert.equal(metadata.parameters[0]!.primitive.success, true);
      const pipe = metadata.parameters[0]!.primitive;
      if (!pipe.success) throw new Error("authored pipe must succeed");
      pipe.data.components.objects[0]!.properties[0]!.value.atomics[0]!.type =
        index === 1 ? "string" : "number";
      metadata.parameters[0]!.imports = [
        {
          file: "/server/controller.ts",
          default: index === 0 ? "DefaultDto" : null,
          asterisk: index === 1 ? "Dtos" : null,
          elements: index === 2 ? ["LocalDto"] : [],
          ...(index === 2
            ? { elementAliases: { LocalDto: "ReexportedDto" } }
            : {}),
        },
      ];
      metadata.parameters[0]!.type = {
        name: ["DefaultDto", "Dtos.Input", "LocalDto"][index]!,
      };
      metadata.success = {
        ...metadata.parameters[0]!,
        primitive: structuredClone(pipe),
        type: { name: "Promise<SourceOutput>" },
      };
      if (metadata.success.primitive.success)
        metadata.success.primitive.data.metadata.nullable = true;
      originals.push({ metadata, bytes: JSON.stringify(metadata) });
      Reflect.defineMetadata(
        "nestia/McpRoute",
        { name: `tool${index}`, inputSchema: {}, outputSchema: {} },
        target.prototype.tool,
      );
      Reflect.defineMetadata(
        "nestia/McpRoute/Parameters",
        [{ category: "params", index: 0 }],
        target.prototype,
        "tool",
      );
      const controller = {
        ...http.controller,
        class: target,
        file: "/server/controller.ts",
      };
      const operation = ReflectMcpOperationAnalyzer.analyze({
        project,
        controller,
        function: target.prototype.tool,
        name: "tool",
        metadata,
      });
      assert.ok(operation);
      assert.equal(
        operation.parameters[0]!.metadata,
        metadata.parameters[0]!.primitive,
      );
      assert.equal(operation.returnMetadata, metadata.success.primitive);
      return { controller, operation };
    });

    const routes = reflected.flatMap((props) =>
      TypedMcpRouteAnalyzer.analyze({
        ...props,
        clone: true,
        errors: project.errors,
      }),
    );
    assert.equal(routes.length, 3);
    assert.deepEqual(project.errors, []);
    const collection = TypedHttpRouteAnalyzer.routeDictionary([
      http,
      ...routes,
    ]);
    assert.deepEqual([...collection.objects.keys()].sort(), [
      "HttpController.IFallbackQuery",
      "SecondController.IFallbackQuery",
    ]);
    await CloneGenerator.write({
      project,
      collection,
      routes: [http, ...routes],
    });
    for (const [index, route] of routes.entries()) {
      const namespace = index === 1 ? "SecondController" : "HttpController";
      assert.equal(route.input!.type.name, `${namespace}.IFallbackQuery`);
      assert.equal(
        route.returnType!.name,
        `null | ${namespace}.IFallbackQuery`,
      );
      assert.deepEqual(
        route.imports.map((i) => i.file),
        [path.join(root, "structures", namespace)],
      );
      const importer = new ImportDictionary(`${root}/functional/mcp/index.ts`);
      const text = SdkMcpRouteProgrammer.write(project)(importer)(route)
        .map((node) => new TsPrinter().print(node))
        .join("\n");
      assert.match(
        text,
        new RegExp(`type Input = ${namespace}\\.IFallbackQuery`),
      );
      assert.match(
        text,
        new RegExp(`type Output = null \\| ${namespace}\\.IFallbackQuery`),
      );
      assert.doesNotMatch(
        text,
        /DefaultDto|Dtos\.Input|LocalDto|SourceOutput|Primitive</,
      );
      assert.ok(
        importer.toImports().every((i) => i.file !== "/server/controller.ts"),
      );
      const importText = importer
        .toStatements(path.join(root, "functional", "mcp"))
        .map((node) => new TsPrinter().print(node))
        .join("\n");
      assert.ok(importText.includes(`from "../../structures/${namespace}"`));
      assert.doesNotMatch(importText, /\\/);
      const declaration = fs.readFileSync(
        path.join(root, "structures", `${namespace}.ts`),
        "utf8",
      );
      assert.match(
        declaration,
        new RegExp(`visible: ${index === 1 ? "string" : "number"}`),
      );
    }
    const source = TypedMcpRouteAnalyzer.analyze({
      ...reflected[0]!,
      clone: false,
    })[0]!;
    assert.equal(source.input!.type.name, "DefaultDto");
    assert.equal(source.inputMetadata, undefined);
    assert.equal(source.imports[0]!.file, "/server/controller.ts");
    const sourceText = SdkMcpRouteProgrammer.write({
      ...project,
      config: { ...project.config, clone: false },
    })(new ImportDictionary(`${root}/source.ts`))(source)
      .map((node) => new TsPrinter().print(node))
      .join("\n");
    assert.match(sourceText, /type Input = DefaultDto/);
    assert.match(sourceText, /Primitive<SourceOutput>/);
    const inlinePipe = structuredClone(
      originals[0]!.metadata.parameters[0]!.primitive,
    );
    if (!inlinePipe.success)
      throw new Error("authored inline pipe must succeed");
    inlinePipe.data.components.objects = [];
    inlinePipe.data.metadata.objects = [];
    inlinePipe.data.metadata.atomics = [{ type: "boolean", tags: [] }];
    const inlineRoute = TypedMcpRouteAnalyzer.analyze({
      controller: reflected[0]!.controller,
      operation: {
        ...reflected[0]!.operation,
        parameters: [],
        returnMetadata: inlinePipe,
      },
      clone: true,
    })[0]!;
    const inlineCollection = TypedHttpRouteAnalyzer.routeDictionary([
      inlineRoute,
    ]);
    assert.equal(inlineCollection.objects.size, 0);
    await CloneGenerator.write({
      project,
      collection: inlineCollection,
      routes: [inlineRoute],
    });
    assert.equal(inlineRoute.returnType!.name, "boolean");
    assert.deepEqual(inlineRoute.imports, []);
    const voidOperation = {
      ...reflected[0]!.operation,
      parameters: [],
      returnType: { name: "void" },
      returnMetadata: HandWrittenMetadata.operation({
        baked: false,
        members: [],
      }).success.primitive as IOperationMetadata.IResponse["primitive"],
    };
    const voidRoute: ITypedMcpRoute = TypedMcpRouteAnalyzer.analyze({
      controller: reflected[0]!.controller,
      operation: voidOperation,
      clone: true,
    })[0]!;
    assert.equal(voidRoute.input, null);
    const voidText = SdkMcpRouteProgrammer.write(project)(
      new ImportDictionary(`${root}/void.ts`),
    )(voidRoute)
      .map((node) => new TsPrinter().print(node))
      .join("\n");
    assert.match(voidText, /type Output = void/);
    assert.doesNotMatch(voidText, /type Input/);
    const unresolvedPipe = structuredClone(
      originals[0]!.metadata.parameters[0]!.primitive,
    );
    if (!unresolvedPipe.success)
      throw new Error(
        "authored unresolved pipe must succeed before its component is removed",
      );
    unresolvedPipe.data.components.objects = [];
    for (const bad of [
      undefined,
      {
        success: false as const,
        errors: [{ name: "Invalid", accessor: null, messages: ["not JSON"] }],
      },
      unresolvedPipe,
    ]) {
      const errors: INestiaProject["errors"] = [];
      const operation = {
        ...reflected[0]!.operation,
        returnMetadata: bad as
          | IOperationMetadata.IResponse["primitive"]
          | undefined,
      };
      assert.deepEqual(
        TypedMcpRouteAnalyzer.analyze({
          controller: reflected[0]!.controller,
          operation,
          clone: true,
          errors,
        }),
        [],
      );
      assert.equal(errors.length, 1);
      assert.ok(errors[0]!.contents.length > 0);
    }
    for (const original of originals)
      assert.equal(JSON.stringify(original.metadata), original.bytes);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
