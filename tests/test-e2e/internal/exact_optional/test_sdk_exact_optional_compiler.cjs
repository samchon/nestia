const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies the original exact-optional producer and generated consumer
 * verdicts.
 *
 * The ordinary rich program uses the original non-exact baseline. An optional
 * property analyzed there cannot prove exact-optional semantics by checking its
 * clone under a different flag. This boundary retains the one contradictory
 * source premise and all twelve positive and five negative assignments, property spellings and Swagger required flags.
 *
 * 1. Compile the original optional controller and DTO with the exact flag.
 * 2. Generate its cloned SDK and Swagger from one public, unlistened Nest application.
 * 3. Compile and execute the original seventeen assignment controls with the same
 *    flag.
 *
 * @evidence contracts/testing.md#behavioral-verification Installed TtscCompiler must emit the original controller under exactOptionalPropertyTypes:true, the actual installed SDK must generate its cloned declarations, and the consumer must accept twelve authored valid assignments while consuming five expected-error directives. An unused directive or unexpected valid-case diagnostic fails the compiler result.
 * @evidence contracts/testing.md#independent-expectations Original IOptional defines optional versus explicitly undefinable members, nested required members, Partial and Required mappings, generic/class/alias/intersection/union/array/tuple shapes. The copied original twelve positives and five negatives are the independent assignment oracle, not types inferred from current generator output.
 * @evidence contracts/testing.md#distinguishing-cases Omission and present optional/nullable values, explicit undefined, nested requiredInner, Partial/generic/class/alias/intersection/union/array/tuple positives contrast forbidden optional undefined/string, omitted required object and mapped properties, and an empty required tuple. The ordinary rich false program retains its own original premise. The property case retains fourteen optional spellings and five required neighbors, key/undefined/inline distinctions and schema required controls; the Swagger case retains four exact query/header required flags. Ordinary SDK boundary HTTP cases retain transport coverage.
 * @evidence contracts/testing.md#execution-ownership The sole E2E entry invokes this matching export once after shared packed installation. Two explicit public compiler requests and one All invocation (SDK and Swagger generation) own the contradictory type boundary; all three matching generated consumer functions are independently required and awaited after its successful compilation.
 * @evidence contracts/e2e.md#necessary-boundary Native exact-flag extraction must connect to actual clone generation and the TypeScript consumer checker. An authored metadata writer fragment alone cannot establish these original seventeen generated-declaration verdicts.
 * @evidence contracts/e2e.md#shared-execution The same eight packed artifacts, public compiler class and absolute native cache serve both exact requests. There is no additional pack or installation. One public application-input All invocation generates SDK and Swagger and avoids ConfigAnalyzer's source-input recompilation. A Nest app is created and closed without listen or a backend port; no HTTP host is added.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A distinct owned directory contains only the contradictory exact producer, generated SDK/Swagger and three consumer cases. Both configurations explicitly use the same true flag and unique output paths. API context environment activates the SDK contributor without changing parent process environment. The caller records actual phase attempts and raw results; app closure is attempted on generation failure and preserves the primary failure if cleanup also fails.
 * @evidence contracts/e2e.md#preserved-coverage Original clone-exact-optional true producer/consumer and all twelve positive/five negative assignment controls retain an executable destination. No negative directive is removed to fit the ordinary false population. All original property and Swagger controls execute in the same true consumer; ordinary HTTP optional cases remain separately owned; the original feature corpus remains until this replacement is actually verified.
 */
const test_sdk_exact_optional_compiler = async ({
  installation,
  sandbox,
  record,
  TtscCompiler,
  cacheDir,
}) => {
  const directory = path.join(sandbox, "exact-optional");
  fs.cpSync(path.resolve(__dirname, "../../exact-optional"), directory, {
    recursive: true,
  });
  const phases = [];
  let application;
  let primary;
  const common = {
    extends: path.resolve(__dirname, "../../../config/tsconfig.json"),
    compilerOptions: {
      exactOptionalPropertyTypes: true,
      noEmit: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      types: ["node"],
      plugins: [{ transform: "@nestia/core/native/transform.cjs" }],
    },
  };
  const compile = (phase) => {
    const config = {
      ...common,
      compilerOptions: {
        ...common.compilerOptions,
        rootDir: `${phase}/src`,
        outDir: `.${phase}`,
      },
      include: [`${phase}/src/**/*.ts`],
    };
    const tsconfig = `tsconfig.${phase}.json`;
    fs.writeFileSync(
      path.join(directory, tsconfig),
      JSON.stringify(config, null, 2),
    );
    record(`exact-optional-${phase}-config.json`, config);
    const state = {
      operation: "TtscCompiler.compile",
      phase,
      started: Date.now(),
    };
    phases.push(state);
    const result = new TtscCompiler({
      cwd: directory,
      tsconfig,
      cacheDir,
      env: { NESTIA_SDK_TRANSFORM: "1", TTSC_CACHE_DIR: cacheDir },
    }).compile();
    state.milliseconds = Date.now() - state.started;
    state.status = result.type;
    record(`exact-optional-${phase}-result.json`, result);
    if (result.type === "exception") throw result.error;
    assert.equal(result.type, "success", JSON.stringify(result.diagnostics));
    assert(
      Object.keys(result.output).length > 0,
      `${phase} emitted no artifacts.`,
    );
    const output = path.join(directory, `.${phase}`);
    for (const [file, text] of Object.entries(result.output)) {
      const destination = path.resolve(directory, file);
      const relative = path.relative(output, destination);
      assert(
        relative && !relative.startsWith("..") && !path.isAbsolute(relative),
        `Unexpected compiler output: ${file}`,
      );
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, text);
    }
  };
  try {
    compile("producer");
    const controllerFile = path.join(
      directory,
      ".producer/controllers/OptionalController.js",
    );
    const { OptionalController } = require(controllerFile);
    const { Module } = require(
      require.resolve("@nestjs/common", { paths: [installation.directory] }),
    );
    const { NestFactory } = require(
      require.resolve("@nestjs/core", { paths: [installation.directory] }),
    );
    const { NestiaSdkApplication } = require(
      require.resolve("@nestia/sdk", { paths: [installation.directory] }),
    );
    class ExactOptionalModule {}
    Module({ controllers: [OptionalController] })(ExactOptionalModule);
    phases.push({ operation: "NestFactory.create", listening: false });
    application = await NestFactory.create(ExactOptionalModule, {
      logger: false,
      abortOnError: false,
    });
    record(
      "exact-optional-operation-metadata.json",
      ["echo", "inline", "query"].map((method) => ({
        method,
        operation: Reflect.getMetadata(
          "nestia/OperationMetadata",
          OptionalController.prototype,
          method,
        ),
      })),
    );
    const generation = {
      operation: "NestiaSdkApplication.all",
      started: Date.now(),
    };
    phases.push(generation);
    await new NestiaSdkApplication({
      input: async () => application,
      clone: true,
      simulate: true,
      output: path.join(directory, "consumer/src/api"),
      swagger: { output: path.join(directory, "consumer/swagger.json"), beautify: true },
    }).all();
    generation.milliseconds = Date.now() - generation.started;
    generation.status = "success";
    compile("consumer");
    const caseResults = [];
    const caseFailures = [];
    for (const name of [
      "test_clone_optional_assignability",
      "test_clone_optional_properties",
      "test_swagger_optional_parameters",
    ]) {
      try {
        const consume = require(
          path.join(directory, `.consumer/test/features/${name}.js`),
        )[name];
        assert.equal(typeof consume, "function", `${name} must be executable.`);
        await consume();
        caseResults.push({ name, status: "success" });
      } catch (error) {
        caseResults.push({ name, status: "failure", error });
        caseFailures.push(error);
      }
    }
    record("exact-optional-case-results.json", caseResults);
    assert.equal(caseResults.length, 3);
    if (caseFailures.length > 0)
      throw new AggregateError(caseFailures, "Exact optional controls failed.");
    assert.equal(
      phases.filter((p) => p.operation === "TtscCompiler.compile").length,
      2,
    );
    assert.equal(
      phases.filter((p) => p.operation === "NestiaSdkApplication.all").length,
      1,
    );
    console.log(
      " - exact optional: 3 cases: 12 positive / 5 negative assignments, original property spellings and Swagger flags; compiler requests 2, All invocation 1 (SDK 1 / Swagger 1), unlistened app 1.",
    );
  } catch (error) {
    primary = error;
  }
  const secondary = [];
  try {
    record("exact-optional-phases.json", {
      phases,
      compilerRequests: phases.filter(
        (p) => p.operation === "TtscCompiler.compile",
      ).length,
      allInvocations: phases.filter(
        (p) => p.operation === "NestiaSdkApplication.all",
      ).length,
      completedSdkGenerations: phases.filter((p) => p.operation === "NestiaSdkApplication.all" && p.status === "success").length,
      completedSwaggerGenerations: phases.filter((p) => p.operation === "NestiaSdkApplication.all" && p.status === "success").length,
      partialAllGenerationStatus: phases.some((p) => p.operation === "NestiaSdkApplication.all" && p.status !== "success") ? "unknown; inspect retained artifact files" : null,
      applicationLifetimes: phases.filter(
        (p) => p.operation === "NestFactory.create",
      ).length,
      listeningBackends: 0,
    });
  } catch (error) {
    secondary.push(error);
  }
  try {
    const sources = {};
    for (const tree of ["producer", "consumer", ".producer", ".consumer"]) {
      const root = path.join(directory, tree);
      if (!fs.existsSync(root)) continue;
      for (const relative of fs.readdirSync(root, { recursive: true })) {
        const file = path.join(root, relative);
        if (fs.statSync(file).isFile())
          sources[path.join(tree, relative)] = fs.readFileSync(file, "utf8");
      }
    }
    record("exact-optional-source-files.json", sources);
  } catch (error) {
    secondary.push(error);
  }
  if (application !== undefined) {
    try {
      await application.close();
    } catch (error) {
      secondary.push(error);
    }
  }
  if (secondary.length > 0)
    throw new AggregateError(
      primary === undefined ? secondary : [primary, ...secondary],
      "Exact optional artifact capture or cleanup failed.",
      primary === undefined ? undefined : { cause: primary },
    );
  if (primary !== undefined) throw primary;
};
module.exports = { test_sdk_exact_optional_compiler };
