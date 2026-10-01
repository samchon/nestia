import { Controller, Get, Query } from "@nestjs/common";
import { TsPrinter } from "@ttsc/factory";
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import type { INestiaProject } from "../../../../../packages/sdk/lib/structures/INestiaProject";
import type { IOperationMetadata } from "../../../../../packages/sdk/lib/structures/IOperationMetadata";
import type { IReflectMcpOperation } from "../../../../../packages/sdk/lib/structures/IReflectMcpOperation";
import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("identifier")
class IdentifierController {
  @Get()
  public get(@Query() _query: object): void {}
}
class IdentifierMcpController {
  public tool(_input: object): object {
    return {};
  }
}

/**
 * Verifies clone bindings and every reference share legal identifier accessors.
 *
 * Native component keys can contain punctuation from a generic literal. They
 * remain schema keys, while generated declarations, imports and type references
 * must use TypeScript identifiers without losing the literal's wire meaning.
 *
 * 1. Check independent Unicode, reserved-name and duplicate-marker spellings.
 * 2. Generate HTTP and MCP clones from the Google literal/default-scopes graph.
 * 3. Separate unequal raw names which encode to the same declaration slot and
 *    compare Swagger and raw metadata before and after actual clone
 *    generation.
 *
 * @evidence contracts/testing.md#behavioral-verification StringUtil.accessorsOf, actual CloneGenerator, routeDictionary and MCP namespace emission share the independently expected binding spelling; HTTP/MCP imports and input/output references reach the emitted declarations, and unequal encoded collisions retain both schemas.
 * @evidence contracts/testing.md#independent-expectations Unicode IdentifierStart/IdentifierPart and TypeScript strict binding/type-name restrictions establish literal accessor expectations. The Google value remains the literal google-auth and its omitted generic scopes default remains string-array; component keys and Swagger are independent JSON contracts.
 * @evidence contracts/testing.md#distinguishing-cases Legal contextual and namespace names, first digits, punctuation, reserved bindings, astral/combining/joiner Unicode, isolated surrogates, empty segments and final versus embedded/repeated duplicate markers distinguish encoding boundaries. Equivalent HTTP/MCP definitions reuse a slot, while an unequal already-encoded name must split it.
 * @evidence contracts/testing.md#execution-ownership The canonical test-sdk entry discovers the sole matching export. Built owning operations consume authored metadata and write one finally-cleaned directory; no consumer installation, product compiler, host or native analysis is introduced. Actual native generic extraction and generated consumer compilation remain in the shared header-generic E2E owner.
 */
export const test_sdk_clone_identifier_accessors = async (): Promise<void> => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { StringUtil } = require(
    path.join(sdk, "utils/StringUtil"),
  ) as typeof import("../../../../../packages/sdk/lib/utils/StringUtil");
  const { TypedHttpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedHttpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedHttpRouteAnalyzer");
  const { TypedMcpRouteAnalyzer } = require(
    path.join(sdk, "analyses/TypedMcpRouteAnalyzer"),
  ) as typeof import("../../../../../packages/sdk/lib/analyses/TypedMcpRouteAnalyzer");
  const { CloneGenerator } = require(
    path.join(sdk, "generates/CloneGenerator"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/CloneGenerator");
  const { SdkMcpRouteProgrammer } = require(
    path.join(sdk, "generates/internal/SdkMcpRouteProgrammer"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/SdkMcpRouteProgrammer");
  const { ImportDictionary } = require(
    path.join(sdk, "generates/internal/ImportDictionary"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/ImportDictionary");
  const cases: Array<[string, string[]]> = [
    [
      "IGoogleTokenActivategoogle-authArraystring",
      ["IGoogleTokenActivategoogle_x2D_authArraystring"],
    ],
    ["Ns.Member", ["Ns", "Member"]],
    ["GenNs.Inner", ["GenNs", "Inner"]],
    ["IDirectory-o1", ["IDirectory", "o1"]],
    ["Ns.IDirectory-o12", ["Ns", "IDirectory", "o12"]],
    ["Foo-o1-o2", ["Foo_x2D_o1", "o2"]],
    ["Foo-o1.Bar", ["Foo_x2D_o1", "Bar"]],
    ["Foo-o", ["Foo_x2D_o"]],
    ["Foo-o1tail", ["Foo_x2D_o1tail"]],
    ["__type-o1", ["__type", "o1"]],
    ["$Dto._Member", ["$Dto", "_Member"]],
    [
      "type.async.readonly.intrinsic",
      ["type", "async", "readonly", "intrinsic"],
    ],
    ["eval.arguments", ["eval", "arguments"]],
    ["Ns.string.Dto", ["Ns", "string", "Dto"]],
    ["Ns.await", ["Ns", "await"]],
    ["Café.한글", ["Café", "한글"]],
    ["\u{10400}Dto", ["\u{10400}Dto"]],
    ["A\u0301", ["A\u0301"]],
    ["A\u200CB\u200D", ["A\u200CB\u200D"]],
    ["\u0301A", ["_x301_A"]],
    ["\uD800", ["_xD800_"]],
    ["\u{1F600}", ["_x1F600_"]],
    ["9Value", ["_x39_Value"]],
    ["A/B~C", ["A_x2F_B_x7E_C"]],
    ["\\u0041", ["_x5C_u0041"]],
    ["", ["_"]],
    ["Ns..Value", ["Ns", "_", "Value"]],
    ["default.class", ["_default", "_class"]],
    ["await.yield", ["_await", "_yield"]],
    ["string.unknown", ["_string", "_unknown"]],
    ["_x2D_", ["_x2D_"]],
  ];
  for (const [input, expected] of cases)
    assert.deepEqual(StringUtil.accessorsOf(input), expected, input);

  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-clone-identifiers-"),
  );
  try {
    const project: INestiaProject = {
      config: { input: [], output: root, clone: true },
      input: { controllers: [] },
      errors: [],
      warnings: [],
    };
    const rawName = "IGoogleTokenActivategoogle-authArraystring";
    const binding = "IGoogleTokenActivategoogle_x2D_authArraystring";
    const metadata = HandWrittenMetadata.operation({
      baked: false,
      members: [],
    }) as unknown as IOperationMetadata;
    const parameter = metadata.parameters[0];
    assert.ok(parameter, "authored operation has one parameter");
    assert.ok(parameter.type, "the authored parameter names its source type");
    // This graph models the original Value='google-auth', Scopes=string[]
    // meaning, not the producer's spelling algorithm.
    for (const pipe of [parameter.primitive, parameter.resolved]) {
      assert.equal(pipe.success, true);
      if (!pipe.success) throw new Error("authored Google graph must succeed");
      assert.ok(Array.isArray(pipe.data.components.objects));
      assert.ok(Array.isArray(pipe.data.metadata.objects));
      const object = pipe.data.components.objects[0];
      const reference = pipe.data.metadata.objects[0];
      assert.ok(object, "authored object component exists");
      assert.ok(reference, "authored root references that component");
      assert.ok(Array.isArray(object.properties));
      object.name = rawName;
      reference.name = rawName;
      const property = object.properties[0];
      assert.ok(property, "authored object has a property");
      assert.ok(property.key);
      assert.ok(property.value);
      assert.ok(Array.isArray(property.key.constants));
      const key = property.key.constants[0];
      assert.ok(key);
      assert.equal(key.type, "string");
      assert.ok(Array.isArray(key.values));
      const keyValue = key.values[0];
      assert.ok(keyValue);
      assert.equal(typeof keyValue.value, "string");
      keyValue.value = "value";
      property.value.atomics = [];
      property.value.constants = structuredClone(property.key.constants);
      const literal = property.value.constants[0];
      assert.ok(literal);
      assert.equal(literal.type, "string");
      const literalValue = literal.values[0];
      assert.ok(literalValue);
      literalValue.value = "google-auth";
      const element = structuredClone(property.value);
      element.constants = [];
      element.atomics = [{ type: "string", tags: [] }];
      pipe.data.components.arrays = [
        {
          name: "Arraystring",
          value: element,
          index: 0,
          recursive: false,
          nullables: [false],
        },
      ];
      const scopes = structuredClone(property);
      const scopesKey = scopes.key.constants[0];
      assert.ok(scopesKey);
      const scopesKeyValue = scopesKey.values[0];
      assert.ok(scopesKeyValue);
      scopesKeyValue.value = "scopes";
      scopes.value.constants = [];
      scopes.value.arrays = [{ name: "Arraystring", tags: [] }];
      object.properties.push(scopes);
      Object.assign(pipe.data.metadata, {
        name: rawName,
        jsonSchema: {
          version: "3.1",
          components: {
            schemas: {
              [rawName]: {
                type: "object",
                properties: {
                  value: { type: "string", enum: ["google-auth"] },
                  scopes: { type: "array", items: { type: "string" } },
                },
                required: ["value", "scopes"],
              },
            },
          },
          schema: { $ref: `#/components/schemas/${rawName}` },
        },
      });
    }
    metadata.success = {
      ...parameter,
      type: { name: "SourceOutput" },
    };
    const rawBytes = JSON.stringify(metadata);
    // HTTP's legacy resolver owns and attaches references in its input. MCP
    // receives the independently retained raw pipe and resolves a private copy.
    const httpOwned = structuredClone(metadata);
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      httpOwned,
      IdentifierController.prototype,
      "get",
    );
    const http = SwaggerCompositionHarness.routes(IdentifierController)[0];
    assert.ok(http);
    assert.ok(http.queryObject);
    const beforeSwagger = await SwaggerCompositionHarness.compose([http], {
      openapi: "3.1",
    });
    assert.ok(
      beforeSwagger.components?.schemas?.[rawName],
      "Swagger keeps the raw component key",
    );
    const operation: IReflectMcpOperation = {
      protocol: "mcp",
      name: "tool",
      toolName: "tool",
      title: null,
      toolDescription: null,
      inputSchema: {},
      outputSchema: {},
      annotations: null,
      function: IdentifierMcpController.prototype.tool,
      parameters: [
        {
          ...parameter,
          category: "params",
          type: parameter.type,
          metadata: parameter.primitive,
        },
      ],
      returnType: { name: "SourceOutput" },
      returnMetadata: parameter.primitive,
      imports: [],
      description: null,
      jsDocTags: [],
    };
    const mcp = TypedMcpRouteAnalyzer.analyze({
      controller: { ...http.controller, class: IdentifierMcpController },
      operation,
      clone: true,
    })[0];
    assert.ok(mcp);
    assert.ok(mcp.input);
    assert.ok(mcp.returnType);
    const collection = TypedHttpRouteAnalyzer.routeDictionary([http, mcp]);
    assert.equal(collection.objects.size, 1);
    assert.ok(collection.objects.has(rawName));
    const httpResolvedBytes = JSON.stringify(httpOwned);
    await CloneGenerator.write({ project, collection, routes: [http, mcp] });
    const declaration = fs.readFileSync(
      path.join(root, "structures", `${binding}.ts`),
      "utf8",
    );
    assert.ok(declaration.includes(`export type ${binding}`), declaration);
    assert.match(declaration, /value:\s*"google-auth"/);
    assert.match(declaration, /scopes:\s*string\[\]/);
    assert.equal(http.queryObject.type.name, binding);
    assert.equal(mcp.input.type.name, binding);
    assert.equal(mcp.returnType.name, binding);
    for (const route of [http, mcp])
      assert.ok(
        route.imports.some(
          (entry) =>
            path.resolve(entry.file) ===
              path.join(root, "structures", binding) &&
            entry.elements.includes(binding),
        ),
      );
    const importer = new ImportDictionary(
      path.join(root, "functional", "mcp", "index.ts"),
    );
    const namespace = SdkMcpRouteProgrammer.write(project)(importer)(mcp)
      .map((node) => new TsPrinter().print(node))
      .join("\n");
    assert.ok(namespace.includes(`type Input = ${binding}`), namespace);
    assert.ok(namespace.includes(`type Output = ${binding}`), namespace);
    const imports = importer
      .toStatements(path.join(root, "functional", "mcp"))
      .map((node) => new TsPrinter().print(node))
      .join("\n");
    assert.ok(imports.includes(`from "../../structures/${binding}"`), imports);
    assert.equal(JSON.stringify(metadata), rawBytes);
    assert.equal(JSON.stringify(httpOwned), httpResolvedBytes);
    assert.deepEqual(
      await SwaggerCompositionHarness.compose([http], { openapi: "3.1" }),
      beforeSwagger,
    );

    // A legal source name may already spell an escape. The existing semantic
    // partition must separate different bodies, not overwrite one declaration.
    const unequal = structuredClone(metadata);
    const unequalParameter = unequal.parameters[0];
    assert.ok(unequalParameter);
    const mcpParameter = operation.parameters[0];
    assert.ok(mcpParameter);
    for (const pipe of [
      unequalParameter.primitive,
      unequalParameter.resolved,
    ]) {
      if (!pipe.success)
        throw new Error("authored collision graph must succeed");
      const object = pipe.data.components.objects[0];
      const reference = pipe.data.metadata.objects[0];
      assert.ok(object);
      assert.ok(reference);
      const property = object.properties[0];
      assert.ok(property);
      assert.ok(property.value);
      object.name = binding;
      reference.name = binding;
      const value = property.value;
      value.constants = [];
      value.atomics = [{ type: "number", tags: [] }];
    }
    const different = TypedMcpRouteAnalyzer.analyze({
      controller: { ...http.controller, class: IdentifierMcpController },
      operation: {
        ...operation,
        returnMetadata: unequalParameter.primitive,
        parameters: [
          {
            ...mcpParameter,
            metadata: unequalParameter.primitive,
          },
        ],
      },
      clone: true,
    })[0];
    assert.ok(different);
    assert.ok(different.input);
    const collisions = TypedHttpRouteAnalyzer.routeDictionary([
      http,
      different,
    ]);
    assert.equal(collisions.objects.size, 2);
    await CloneGenerator.write({
      project,
      collection: collisions,
      routes: [http, different],
    });
    assert.equal(http.queryObject.type.name, `IdentifierController.${binding}`);
    assert.equal(
      different.input.type.name,
      `IdentifierMcpController.${binding}`,
    );
    const first = fs.readFileSync(
      path.join(root, "structures", "IdentifierController.ts"),
      "utf8",
    );
    const second = fs.readFileSync(
      path.join(root, "structures", "IdentifierMcpController.ts"),
      "utf8",
    );
    assert.match(first, /value:\s*"google-auth"/);
    assert.match(second, /value:\s*number/);
    assert.equal(JSON.stringify(metadata), rawBytes);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
