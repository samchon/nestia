const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const { preparePublicConsumer } = require("./PublicConsumer");
const { compilePublicProgram } = require("./PublicCompiler");
const { test_public_user_global } = require("./test_public_user_global");
const {
  test_public_transform_envelope,
} = require("./test_public_transform_envelope");
const {
  test_public_disabled_transform,
} = require("./test_public_disabled_transform");
const {
  test_public_no_emit_diagnostics,
} = require("./test_public_no_emit_diagnostics");
const {
  test_public_typia_version_guard,
} = require("./test_public_typia_version_guard");
const { test_public_legacy_plugins } = require("./test_public_legacy_plugins");

/**
 * Runs authored and freshly generated HTTP cases through one installed program.
 *
 * One producer compiles the authored controllers. The actual application feeds
 * generation without another input compiler and then serves every consumer
 * request. One consumer compilation prepares the authored and generated cases;
 * plain JavaScript execution starts no TypeScript loader or native host.
 * Scenario execution policy retains document-only inputs without promoting
 * their generated random calls into transport assertions: those artifacts are
 * still generated and compiled, while authored cases exercise their required
 * connections. The installed compiler's version-rejection and legacy-plugin
 * boundaries are reported separately; their assertion failures do not suppress
 * executable HTTP cases. A no-DOM user-global boundary shares this installation
 * and cache; its conflicting library set requires a separate minimal program,
 * while the native DOM twin reuses the existing consumer. The producer uses the
 * explicit legacy SDK entry with its environment activation off; the consumer
 * uses modern entries and activation.
 *
 * @evidence contracts/common.md#principled-implementation Public installed TtscCompiler emits the actual authored controller and consumer programs with their shared strict language configuration. Public Nest and SDK application-input APIs use one real application for generation and requests. DynamicExecutor retains all authored assertions and existing rich generated transport assertions; explicit scenario execution policy preserves a transferred input's original absence of automatic E2E execution without dropping its generation or compilation.
 * @evidence contracts/common.md#clear-and-simple-design Installation, independent compiler boundary cases, producer, generation, consumer compilation and request execution have visible results. Boundary failures are retained with their names while positive HTTP cases continue; their final result aggregates both populations. Explicit legacy SDK registration activates the producer, while environment activation serves the modern consumer; they do not activate the same program twice. One finally block owns application release, including initialization, generation and consumer failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All product operations resolve through the ordinary packed installation. The runner patches neither generated JavaScript nor foreign resolvers and copies no previously generated clients or automated cases as input.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies each necessary boundary and its shared lifetime; phase timings, individual failures and discovered counts remain visible.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths locate the assignment-owned fixture. Temporary removal verifies containment before recursive deletion, and the listener uses an OS-assigned loopback port. Public package imports use the consumer's normal Node resolution.
 * @evidence contracts/performance.md#efficient-algorithms Each authored input tree is copied once, each producer and consumer program is compiled once, and generation analyzes the same actual application rather than per-case configurations.
 * @evidence contracts/performance.md#reuse-equivalent-work Stateless controllers have separate scenario routes and common compiler/encryption settings. Generation and requests share those exact compiled controllers and one application; newly generated consumer files are compiled together once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One private fixture, two compilation result maps and one application belong to this run. Emitted files remain in the ignored assignment root; the real application closes in finally after success or any subsequent failure.
 */
async function runPublicHttp() {
  const consumer = await preparePublicConsumer();
  const fixture = path.join(consumer.root, "projects/http-rich");
  const relative = path.relative(consumer.root, fixture);
  assert(
    relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    "Fixture must belong to the public consumer.",
  );
  await fs.rm(fixture, { recursive: true, force: true });
  const source = path.join(__dirname, "features/http-rich/src");
  const execution = JSON.parse(
    await fs.readFile(path.join(source, "../execution.json"), "utf8"),
  );
  const documentOnlyPrefixes = execution.generatedCases
    .filter((policy) => policy.execute === false)
    .map((policy) => `test_api_${policy.accessorPrefix.join("_")}_`);
  for (const directory of ["controllers", "structures"])
    await fs.cp(
      path.join(source, directory),
      path.join(fixture, "src", directory),
      { recursive: true },
    );
  const authoredFeatures = path.join(source, "test/features");
  await fs.cp(authoredFeatures, path.join(fixture, "src/test/features"), {
    recursive: true,
    filter: (file) =>
      path
        .relative(authoredFeatures, file)
        .split(path.sep)
        .every((component) => component !== "automated"),
  });
  const root = path.resolve(__dirname, "../..");
  await fs.cp(
    path.join(source, "benchmark"),
    path.join(fixture, "src/benchmark"),
    {
      recursive: true,
    },
  );
  const config = {
    extends: path.join(root, "tests/config/tsconfig.json"),
    compilerOptions: {
      rootDir: "src",
      outDir: "producer",
      noEmit: false,
      plugins: [
        { transform: "typia/lib/transform" },
        {
          transform: "@nestia/core/lib/transform",
          validate: "assert",
          stringify: "assert",
        },
        { transform: "@nestia/sdk/lib/transform" },
      ],
    },
    include: ["src/controllers"],
  };
  await fs.writeFile(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify(config, null, 2),
  );
  const { TtscCompiler } = consumer.requirePublic("ttsc");
  const cache = path.resolve(
    __dirname,
    process.env.TTSC_CACHE_DIR ?? path.join(root, "node_modules/.cache/ttsc"),
  );
  const boundaryFailures = [];
  const boundaryStarted = Date.now();
  try {
    test_public_typia_version_guard(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_typia_version_guard passed; ${Date.now() - boundaryStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_typia_version_guard", error });
    console.error(
      "Public compiler boundary: test_public_typia_version_guard failed",
      error,
    );
  }
  const disabledStarted = Date.now();
  try {
    await test_public_disabled_transform(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_disabled_transform passed; ${Date.now() - disabledStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_disabled_transform", error });
    console.error(
      "Public compiler boundary: test_public_disabled_transform failed",
      error,
    );
  }
  const envelopeStarted = Date.now();
  try {
    test_public_transform_envelope(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_transform_envelope passed; ${Date.now() - envelopeStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_transform_envelope", error });
    console.error(
      "Public compiler boundary: test_public_transform_envelope failed",
      error,
    );
  }
  const noEmitStarted = Date.now();
  try {
    test_public_no_emit_diagnostics(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_no_emit_diagnostics passed; ${Date.now() - noEmitStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_no_emit_diagnostics", error });
    console.error(
      "Public compiler boundary: test_public_no_emit_diagnostics failed",
      error,
    );
  }
  const provenanceStarted = Date.now();
  try {
    await test_public_user_global(consumer, cache);
    console.log(
      `Public compiler boundary: test_public_user_global passed; ${Date.now() - provenanceStarted} ms`,
    );
  } catch (error) {
    boundaryFailures.push({ name: "test_public_user_global", error });
    console.error(
      "Public compiler boundary: test_public_user_global failed",
      error,
    );
  }
  await compilePublicProgram(
    TtscCompiler,
    fixture,
    "tsconfig.json",
    cache,
    "producer",
    { NESTIA_SDK_TRANSFORM: "" },
  );
  try {
    test_public_legacy_plugins(fixture);
    console.log("Public compiler boundary: test_public_legacy_plugins passed");
  } catch (error) {
    boundaryFailures.push({ name: "test_public_legacy_plugins", error });
    console.error(
      "Public compiler boundary: test_public_legacy_plugins failed",
      error,
    );
  }
  const core = consumer.requirePublic("@nestia/core");
  const { NestFactory } = consumer.requirePublic("@nestjs/core");
  const { NestiaSdkApplication } = consumer.requirePublic("@nestia/sdk");
  const { DynamicExecutor } = consumer.requirePublic("@nestia/e2e");
  const app = await NestFactory.create(
    await core.EncryptedModule.dynamic(
      path.join(fixture, "producer/controllers"),
      {
        key: "A".repeat(32),
        iv: "B".repeat(16),
      },
    ),
    { logger: false },
  );
  const traffic = { active: false, inFlight: 0, peak: 0 };
  try {
    app.use((_request, response, next) => {
      if (!traffic.active) return next();
      traffic.peak = Math.max(traffic.peak, ++traffic.inFlight);
      response.once("close", () => --traffic.inFlight);
      setTimeout(next, 20);
    });
    await app.init();
    const generation = Date.now();
    await new NestiaSdkApplication({
      input: () => app,
      output: path.join(fixture, "src/api"),
      simulate: true,
      e2e: path.join(fixture, "src/test"),
      swagger: {
        output: path.join(fixture, "swagger.json"),
        security: {
          basic: { type: "http", scheme: "basic" },
          bearer: { type: "http", scheme: "bearer" },
          custom: { type: "apiKey", in: "header", name: "Authorization" },
          tagsOAuth2: {
            type: "oauth2",
            flows: {
              implicit: {
                authorizationUrl: "https://example.com/api/oauth/dialog",
                refreshUrl: "https://example.com/api/oauth/refresh",
                scopes: {
                  read: "read authority",
                  write: "write authority",
                },
              },
            },
          },
          oauth2: {
            type: "oauth2",
            flows: {
              implicit: {
                authorizationUrl: "https://example.com/api/oauth/dialog",
                refreshUrl: "https://example.com/api/oauth/refresh",
                scopes: {
                  "write:pets": "modify pets in your account",
                  "read:pets": "read your pets",
                },
              },
            },
          },
          security: {
            type: "oauth2",
            flows: {
              clientCredentials: {
                tokenUrl: "https://example.com/api/oauth/dialog",
                refreshUrl: "https://example.com/api/oauth/refresh",
                scopes: { x1: "x1", x2: "x2" },
              },
            },
          },
        },
        decompose: true,
        operationId: (props) => `${props.class}.${props.function}`,
      },
    }).all();
    console.log(`Public HTTP generation: ${Date.now() - generation} ms`);
    const runtimeConfig = {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        outDir: "consumer",
        plugins: [
          { transform: "typia/lib/transform", enabled: false },
          { transform: "@nestia/core/native/transform.cjs" },
        ],
      },
      include: ["src/test/features", "src/benchmark"],
    };
    await fs.writeFile(
      path.join(fixture, "tsconfig.consumer.json"),
      JSON.stringify(runtimeConfig, null, 2),
    );
    await compilePublicProgram(
      TtscCompiler,
      fixture,
      "tsconfig.consumer.json",
      cache,
      "consumer",
    );
    await app.listen(0, "127.0.0.1");
    const host = await app.getUrl();
    const report = await DynamicExecutor.validate({
      location: path.join(fixture, "consumer/test/features"),
      prefix: "test",
      extension: "js",
      simultaneous: 1,
      filter: (file) =>
        !documentOnlyPrefixes.some((prefix) => file.startsWith(prefix)),
      parameters: () => [
        { host, encryption: { key: "A".repeat(32), iv: "B".repeat(16) } },
        traffic,
      ],
      onComplete: (execution) => {
        console.log(
          ` - ${execution.name}: ${execution.error ? "failed" : "passed"}`,
        );
        if (execution.error) console.error(execution.error);
      },
    });
    if (report.executions.length === 0)
      throw new Error("No public HTTP integration cases were discovered.");
    console.log(
      `Public HTTP runtime: ${report.executions.length} cases; ${report.time} ms`,
    );
    const failures = report.executions.filter((execution) => execution.error);
    if (failures.length || boundaryFailures.length)
      throw new AggregateError(
        [
          ...boundaryFailures.map((failure) => failure.error),
          ...failures.map((execution) => execution.error),
        ],
        `Public HTTP failed: ${[
          ...boundaryFailures.map((failure) => failure.name),
          ...failures.map((execution) => execution.name),
        ].join(", ")}`,
      );
  } finally {
    await app.close();
  }
}

module.exports = { runPublicHttp };
if (require.main === module)
  runPublicHttp().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
