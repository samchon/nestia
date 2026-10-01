const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Copied original compiler inputs preserve diagnostic line identities. They are
// data for the installed compiler, not replacement implementations or backends.
const INPUTS = {
  "llm-body.ts": `import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IArticle {
  title: string;
  thumbnail?: string;
}

@Controller("llm/body")
export class LlmBodyController {
  @TypedRoute.Post()
  public store(@TypedBody() input: IArticle): void {
    input;
  }
}
`,
  "llm-query.ts": `import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IQuery {
  name: string;
  age?: number;
}

@Controller("llm/query")
export class LlmQueryController {
  @TypedRoute.Get()
  public index(@TypedQuery() query: IQuery): void {
    query;
  }
}
`,
  "llm-route.ts": `import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IArticle {
  id: string;
  weak: WeakMap<object, object>;
}

@Controller("llm/route")
export class LlmRouteController {
  @TypedRoute.Get()
  public at(): IArticle {
    return {
      id: "id",
      weak: new WeakMap(),
    };
  }
}
`,
  "tuple.ts": `import { TypedRoute } from "@nestia/core";

interface IResponse {
  pair: [string, number];
}

export class Controller {
  @TypedRoute.Get()
  public get(): IResponse {
    return { pair: ["one", 1] };
  }
}
`,
  "valid.ts": `import { TypedRoute } from "@nestia/core";

interface IResponse {
  value: string;
}

export class Controller {
  @TypedRoute.Get()
  public get(): IResponse {
    return { value: "ok" };
  }
}
export interface CleanDto { title: string; count: number; }
`,
  "bad.ts": `export const x: number = "not a number";\n`,
};

/**
 * Verifies installed compiler diagnostics and publication at nine actual entry
 * requests without another installation or backend.
 *
 * Three strict diagnostics share one emitting API program; the two non-strict
 * controls share another. Seven public CLI requests distinguish emitting tuple
 * rejection, WeakMap noEmit forwarding, three tuple noEmit entries, accepted
 * analysis-only options and ordinary TypeScript rejection. Native requested
 * manifest publication remains an explicitly untransferred internal oracle.
 *
 * 1. Author isolated projects beneath the shared installed sandbox.
 * 2. Invoke the installed public API twice and its public CLI seven times.
 * 3. Assert literal diagnostics, named outputs and observable publication absence.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual installed API and CLI requests reject strict optional body/query and WeakMap schemas, accept both non-strict controls, report the original WeakMap and tuple locations, reject a genuine assignment type error, and suppress output for failed or analysis-only programs. The legal noEmit option control must succeed through the real private ForceEmit traversal.
 * @evidence contracts/testing.md#independent-expectations Copied authored optional fields, WeakMap and tuple inputs establish schema negatives independently of compiler output. The expected decorator codes, tuple/WeakMap reasons, source coordinates, output filenames and TypeScript assignment incompatibility are literals. A successful non-strict program must return both separate JavaScript artifacts whose evaluation uses actual installed decorators.
 * @evidence contracts/testing.md#distinguishing-cases One strict API program requires all three distinct diagnostic owners, with a non-strict optional-body/query emitting twin. The WeakMap CLI noEmit case retains the original launcher witness. Tuple emitting rejection is separate from check, explicit --noEmit and configured noEmit. A valid decorated route and clean DTO with allowImportingTsExtensions distinguish private reload option preservation from a string-to-number type error.
 * @evidence contracts/testing.md#execution-ownership The sole rich E2E entry invokes this matching public export after its shared installation. The operation records nine real compiler requests and aggregates independent case failures; it does not invoke old starts, native executables or compiler internals. Public compile always forces emit, so only the public CLI owns analysis-only entries.
 * @evidence contracts/e2e.md#necessary-boundary Installed descriptor resolution and public API/CLI forwarding connect the composed native compiler to its reporting and output protocol. Source-only Go transforms cannot establish actual JavaScript publication, launcher noEmit forwarding or original diagnostics followed by private ForceEmit.
 * @evidence contracts/e2e.md#shared-execution All nine requests reuse the existing packed installation and absolute native cache, with no install, pack, backend or independently built executable. Compatible strict negatives and compatible non-strict controls are each batched. Different boolean/object LLM settings and check/build/noEmit entry states remain separate real programs rather than being counted as one because their API class is shared.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each named request owns a unique project and output/build-info paths beneath the rich sandbox. Environment overrides belong to API contexts or child processes, SDK environment activation is disabled for these core-only assertions, outputs are bounded before evaluation, and the parent owns installation/sandbox teardown. Results and copied inputs are retained through the parent's evidence recorder before cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original strict and non-strict build-table schema/publication assertions, the WeakMap noEmit wrapper, tuple emitting rejection, three tuple noEmit entries and valid/type-error check controls have named destinations here. Exact internal native manifest request/quiet-stream assertions remain pending in the campaign ledger and original tests; absence of an unrequested manifest is not claimed as coverage.
 */
const test_core_compiler_wrappers = async ({
  installation,
  sandbox,
  record,
  TtscCompiler,
  cacheDir,
}) => {
  assert.equal(
    typeof TtscCompiler,
    "function",
    "The installed public compiler is required.",
  );
  assert(
    path.isAbsolute(cacheDir),
    "Compiler cache must share an absolute root.",
  );
  const root = path.join(sandbox, "core-wrappers");
  fs.mkdirSync(root, { recursive: true });
  const failures = [];
  const requests = [];
  const env = { TTSC_CACHE_DIR: cacheDir, NESTIA_SDK_TRANSFORM: "" };
  const binary = installation.binary("ttsc", "ttsc");
  record("core-wrapper-inputs.json", INPUTS);

  // Each case owns immutable inputs and every potentially published file. No
  // paths alias, copied dependency declarations or resolver hook is installed.
  const project = (name, files, llm, options = {}) => {
    const directory = path.join(root, name);
    const source = path.join(directory, "src");
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({ private: true, type: "commonjs" }),
    );
    for (const file of files)
      fs.writeFileSync(path.join(source, file), INPUTS[file]);
    const config = {
      compilerOptions: {
        target: "ES2022",
        module: "nodenext",
        moduleResolution: "nodenext",
        ignoreDeprecations: "6.0",
        experimentalDecorators: true,
        strict: true,
        skipLibCheck: true,
        types: ["node"],
        rootDir: "src",
        outDir: "output",
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        incremental: true,
        tsBuildInfoFile: "cache.tsbuildinfo",
        plugins: [
          {
            transform: "@nestia/core/native/transform.cjs",
            validate: "assert",
            stringify: "assert",
            llm,
          },
        ],
        ...options,
      },
      files: files.map((file) => `src/${file}`),
    };
    fs.writeFileSync(
      path.join(directory, "tsconfig.json"),
      JSON.stringify(config, null, 2),
    );
    record(`core-wrapper-project-${name}.json`, config);
    return directory;
  };
  const absent = (directory) => {
    for (const file of ["output", "cache.tsbuildinfo"])
      assert(
        !fs.existsSync(path.join(directory, file)),
        `Unexpected published artifact: ${directory}/${file}`,
      );
  };
  const diagnose = (text, ...expected) => {
    const normalized = text.replaceAll("\\", "/");
    for (const item of expected)
      assert(
        normalized.includes(item),
        `Missing diagnostic ${item}:\n${normalized}`,
      );
    return normalized;
  };
  const run = (name, operation) => {
    try {
      operation();
      console.log(` - core wrapper ${name}: passed`);
    } catch (error) {
      failures.push(name);
      console.error(`core wrapper ${name}`, error);
    }
  };
  const api = (name, directory) => {
    const request = { name, entry: "TtscCompiler.compile", directory };
    requests.push(request);
    const started = Date.now();
    try {
      const result = new TtscCompiler({
        cwd: directory,
        tsconfig: "tsconfig.json",
        cacheDir,
        env,
      }).compile();
      record(`core-wrapper-${name}.json`, result);
      if (result.type === "exception") throw result.error;
      return result;
    } finally {
      request.milliseconds = Date.now() - started;
    }
  };
  const cli = (name, directory, args) => {
    const request = { name, entry: "ttsc CLI", directory, args };
    requests.push(request);
    const started = Date.now();
    const result = cp.spawnSync(
      process.execPath,
      [binary, ...args, "-p", "tsconfig.json", "--cache-dir", cacheDir],
      {
        cwd: directory,
        encoding: "utf8",
        windowsHide: true,
        env: { ...process.env, ...env },
      },
    );
    request.milliseconds = Date.now() - started;
    record(`core-wrapper-${name}.json`, {
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error?.message,
    });
    if (result.error) throw result.error;
    assert.equal(
      result.signal,
      null,
      "A terminated process is not a compiler verdict.",
    );
    assert.notEqual(
      result.status,
      null,
      "Compiler must return an actual exit status.",
    );
    return result;
  };
  const tuple = (result) => {
    diagnose(
      `${result.stdout}\n${result.stderr}`,
      "src/tuple.ts:8:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
      "- IResponse.pair: [string, number]",
      "- LLM schema does not support tuple type.",
    );
    assert(
      !result.stderr.includes("JSON does not support tuple type"),
      "The tuple must isolate LLM validation.",
    );
  };

  run("strict-schema-batch", () => {
    const directory = project(
      "strict-schema-batch",
      ["llm-body.ts", "llm-query.ts", "llm-route.ts"],
      { strict: true },
    );
    const result = api("strict-schema-batch", directory);
    assert.equal(result.type, "failure");
    assert.deepEqual(result.output, {});
    // The public API may retain native plugin stderr as one TTSC_PROCESS
    // diagnostic. Project supported structured diagnostics into the same display
    // form, then keep each reason within its own diagnostic header's section.
    const sections = result.diagnostics.flatMap((item) => {
      const code = String(item.code);
      const text =
        typeof item.file === "string" &&
        item.line !== undefined &&
        item.character !== undefined
          ? `${item.file}:${item.line}:${item.character} - ${item.category} TS${
              /^\d+$/.test(code) || code.startsWith("(") ? code : `(${code})`
            }: ${item.messageText}`
          : item.messageText;
      return text
        .replaceAll("\\", "/")
        .split(
          /(?=^[^\n]+:\d+:\d+ - (?:error|warning|suggestion|message) TS)/m,
        );
    });
    for (const [file, line, character, code, details] of [
      [
        "llm-body.ts",
        12,
        17,
        "nestia.core.TypedBody",
        ["Strict mode does not support optional property in object."],
      ],
      [
        "llm-query.ts",
        12,
        17,
        "nestia.core.TypedQuery",
        ["Strict mode does not support optional property in object."],
      ],
      [
        "llm-route.ts",
        11,
        4,
        "nestia.core.TypedRoute",
        ["IArticle.weak: WeakMap", "LLM schema does not support WeakMap type."],
      ],
    ]) {
      const header = `src/${file}:${line}:${character} - error TS(${code}): unsupported type detected`;
      assert(
        sections.some((section) => {
          const firstLine = section.split(/\r?\n/, 1)[0];
          return (
            (firstLine === header || firstLine.endsWith(`/${header}`)) &&
            details.every((detail) => section.includes(detail))
          );
        }),
        `Missing diagnostic section ${header}: ${JSON.stringify(result.diagnostics)}`,
      );
    }
    absent(directory);
  });
  run("non-strict-publication-controls", () => {
    const directory = project(
      "non-strict-publication-controls",
      ["llm-body.ts", "llm-query.ts"],
      { strict: false },
    );
    const result = api("non-strict-publication-controls", directory);
    assert.equal(result.type, "success", JSON.stringify(result));
    for (const [file, name] of [
      ["llm-body", "LlmBodyController"],
      ["llm-query", "LlmQueryController"],
    ]) {
      const key = `output/${file}.js`;
      assert.equal(
        typeof result.output[key],
        "string",
        `Successful control emitted no ${key}.`,
      );
      const destination = path.join(directory, key);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, result.output[key]);
      assert.equal(
        typeof require(destination)[name],
        "function",
        "Actual installed decorators must accept emitted helpers.",
      );
    }
  });
  run("weakmap-explicit-no-emit", () => {
    const directory = project(
      "weakmap-explicit-no-emit",
      ["llm-route.ts"],
      true,
    );
    const result = cli("weakmap-explicit-no-emit", directory, ["--noEmit"]);
    assert.equal(result.status, 3);
    diagnose(
      `${result.stdout}\n${result.stderr}`,
      "src/llm-route.ts:11:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
      "- IArticle.weak: WeakMap",
      "- LLM schema does not support WeakMap type.",
    );
    absent(directory);
  });
  run("tuple-emitting-publication", () => {
    const directory = project("tuple-emitting-publication", ["tuple.ts"], true);
    const result = cli("tuple-emitting-publication", directory, ["build"]);
    assert.equal(result.status, 3);
    tuple(result);
    assert.equal(
      result.stdout.trim(),
      "",
      "Quiet rejected emit published a summary.",
    );
    absent(directory);
  });
  for (const [name, args, options] of [
    ["tuple-check", ["check"], {}],
    ["tuple-explicit-no-emit", ["build", "--noEmit", "--verbose"], {}],
    ["tuple-configured-no-emit", ["build"], { noEmit: true }],
  ])
    run(name, () => {
      const directory = project(name, ["tuple.ts"], true, options);
      const result = cli(name, directory, args);
      assert.equal(result.status, 3);
      tuple(result);
      // The launcher routes explicit noEmit through quiet `check`; its native
      // verbose summary is not a public CLI contract and remains pending.
      if (name !== "tuple-explicit-no-emit")
        assert.equal(result.stdout.trim(), "");
      absent(directory);
    });
  run("valid-check-analysis-only-options", () => {
    const directory = project(
      "valid-check-analysis-only-options",
      ["valid.ts"],
      true,
      { noEmit: true, allowImportingTsExtensions: true },
    );
    const result = cli("valid-check-analysis-only-options", directory, [
      "check",
    ]);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(result.stdout.trim(), "");
    absent(directory);
  });
  run("check-typescript-error", () => {
    const directory = project("check-typescript-error", ["bad.ts"], true);
    const result = cli("check-typescript-error", directory, ["check"]);
    assert.equal(result.status, 2);
    diagnose(`${result.stdout}\n${result.stderr}`, "TS2322", "number");
    absent(directory);
  });
  record("core-wrapper-requests.json", {
    requests,
    actualRequests: requests.length,
    failures,
    pending: [
      "native requested manifest publication",
      "native verbose emit=false summary and quiet stderr",
    ],
  });
  assert.equal(
    requests.length,
    9,
    "Every separately owned wrapper request must execute.",
  );
  return { requests, failures };
};

module.exports = { test_core_compiler_wrappers };
