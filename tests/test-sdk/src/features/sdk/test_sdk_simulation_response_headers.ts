import { Controller, Get, Query } from "@nestjs/common";
import assert from "assert/strict";
import path from "path";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("simulation_headers")
class SimulationHeadersController {
  @Get()
  public get(@Query() _query: object): void {}
}

/**
 * Verifies simulated propagation emits only actual response media headers.
 *
 * A bodyless response has no Content-Type header. Emitting null as its value
 * violates the propagation string header contract even before runtime. The
 * direct writer must distinguish absent media from declared JSON or text.
 *
 * 1. Write simulated functions for HEAD and bodyless GET with no media type.
 * 2. Contrast JSON/text responses, explicit status and default POST status.
 * 3. Check non-propagated simulation remains a direct random return.
 *
 * @evidence contracts/testing.md#behavioral-verification SdkHttpSimulationProgrammer.simulate emits empty propagation headers for null contentType and literal Content-Type strings for JSON/text, preserving status/data and direct-return behavior when propagate is false.
 * @evidence contracts/testing.md#independent-expectations Absent response media means no Content-Type field; IPropagation.IBranch permits string/string-array header values and excludes null. Declared media strings and HTTP GET/HEAD 200 versus POST 201 default statuses establish literal expectations independently of writer output.
 * @evidence contracts/testing.md#distinguishing-cases HEAD/GET null media versus POST JSON/GET text, default versus explicit status, and propagate true versus false exercise adjacent wrapper decisions without weakening generated consumer typing.
 * @evidence contracts/testing.md#execution-ownership The test-sdk matching export calls the built simulation programmer and supported AST printer directly over authored routes. It neither compiles a product fixture nor starts a backend, installer, worker or CLI; actual generated consumer compilation remains the integrated E2E owner.
 */
export const test_sdk_simulation_response_headers = (): void => {
  const sdk = path.resolve(process.cwd(), "../../packages/sdk/lib");
  const { SdkHttpSimulationProgrammer } = require(
    path.join(sdk, "generates/internal/SdkHttpSimulationProgrammer"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/SdkHttpSimulationProgrammer");
  const { ImportDictionary } = require(
    path.join(sdk, "generates/internal/ImportDictionary"),
  ) as typeof import("../../../../../packages/sdk/lib/generates/internal/ImportDictionary");
  const { TsPrinter } = require(
    require.resolve("@ttsc/factory", { paths: [sdk] }),
  );
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    HandWrittenMetadata.operation({ baked: false, members: [] }),
    SimulationHeadersController.prototype,
    "get",
  );
  const baseline = SwaggerCompositionHarness.routes(
    SimulationHeadersController,
  )[0]!;
  for (const [method, contentType, status, expected] of [
    ["HEAD", null, null, 200],
    ["GET", null, 204, 204],
    ["POST", "application/json", null, 201],
    ["GET", "text/plain", 202, 202],
  ] as const) {
    const route = {
      ...baseline,
      method,
      name: "example",
      body: null,
      queryObject: null,
      headerObject: null,
      pathParameters: [],
      queryParameters: [],
      headerParameters: [],
      success: { ...baseline.success, contentType, status },
    };
    const project = {
      config: { input: [], output: "unused", simulate: true, propagate: true },
      input: { controllers: [] },
      errors: [],
      warnings: [],
    };
    const source = new TsPrinter().print(
      SdkHttpSimulationProgrammer.simulate(project)(
        new ImportDictionary(path.join(sdk, "simulation.ts")),
      )(route),
    );
    assert.match(source, new RegExp(`status:\\s*${expected}`));
    assert.match(source, /success:\s*true/);
    assert.match(source, /data:\s*random\(\)/);
    if (contentType === null) {
      assert.match(source, /headers:\s*\{\s*\}/);
      assert.equal(source.includes("Content-Type"), false);
    } else
      assert.ok(source.includes(`"Content-Type": "${contentType}"`), source);
    const direct = new TsPrinter().print(
      SdkHttpSimulationProgrammer.simulate({
        ...project,
        config: { ...project.config, propagate: false },
      })(new ImportDictionary(path.join(sdk, "simulation.ts")))(route),
    );
    assert.match(direct, /return random\(\)/);
    assert.equal(direct.includes("headers:"), false);
  }
};
