const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies an actual failed distribution installer preserves the caller state.
 *
 * A fresh empty offline npm cache forces failure after template creation, so a
 * resolver failure cannot masquerade as the intended installer failure. One
 * child realm isolates process environment and cwd from the shared rich runner.
 *
 * 1. Call the distribution composer from the same packed SDK in a real child.
 * 2. Require an offline npm failure after the nested package has been created.
 * 3. Run the independent original success argv/cwd phase even after failure.
 * 4. Verify exact restoration, record both first outcomes and await close.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SdkDistributionComposer.compose must create nested package.json before its npm install --save-dev returns nonzero. Its caller cwd must remain identical. A signal, resolver failure or inability to launch npm cannot pass as the installer verdict.
 * @evidence contracts/testing.md#independent-expectations A newly created empty cache cannot supply the registry dependencies offline. The explicitly requested nested path, recorded original cwd and original environment values establish independent expectations without deriving them from composer output.
 * @evidence contracts/testing.md#distinguishing-cases Template creation is the positive control preceding the actual installer negative. The command and status distinguish installer failure from earlier dependency resolution failure. Caller cwd and finally-restored environment are both required; successful opaque argv/cwd fixtures additionally retain both concurrent destinations, exact dev ranges, runtime typia tail, emitted helper cleanup/npx root, configured no-ops and both Windows entry layouts.
 * @evidence contracts/testing.md#execution-ownership The sole E2E entry invokes this matching export after shared installation. It awaits the actual Node child's close and propagates its failure through the entry's independent named case aggregation.
 * @evidence contracts/e2e.md#necessary-boundary The installed composer launches actual npm and must preserve caller process state when that child fails. No child_process method, npm method or production loader is replaced.
 * @evidence contracts/e2e.md#shared-execution The existing packed installation supplies the SDK and dependency inventory. One isolated Node child retains the existing failing installer attempt; its independent success phase adds eight real observation/helper children on POSIX or twelve on Windows. No extra wrapper, registry install, compiler or backend is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique rich sandbox directory owns the output and empty cache. Only the child overrides offline/cache/audit/fund environment. Both lowercase and uppercase original values are recorded before deletion and restored in finally. Parent cwd and environment remain untouched; parent teardown removes files after child close.
 * @evidence contracts/e2e.md#preserved-coverage Original distribute-cwd-restore assertions retain actual offline nonzero install, nested package creation and exact cwd preservation. Windows npm-cli.js and POSIX npm retain the same install argv contract. Successful opaque argv/cwd assertions now share the same isolated realm and retain their exact original controls. Actual generated distribution package compilation remains separately pending; observation executables do not certify it.
 * @evidence contracts/common.md#principled-implementation One isolated realm executes the real composer with independent offline and successful executable fixtures. Literal manifests and observed argv/cwd establish results; native relative paths and actual emitted helpers preserve the original filesystem behavior. Private phase coordination restores caller state and reports first outcomes independently.
 * @evidence contracts/common.md#clear-and-simple-design The eligible export owns child acquisition and close; private offline/success operations own their respective inputs and restoration, with one coordinator retaining both results rather than a second wrapper or hidden runner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored npm/npx executables observe actual OS argv and perform no registry work. No composer, process API or loader method is replaced; the offline phase still invokes genuine installed npm with an empty cache.
 * @evidence contracts/common.md#meaningful-documentation The comment separates actual installer failure, successful argument observations and still-pending package compilation, and identifies normal platform child counts rather than treating them as execution evidence.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed destination fixtures and a Windows-only local entry fixture bound child count; observations scan only their recorded calls. Bounded output retains at most 65536 characters and phase records grow only with these fixed operations.
 * @evidence contracts/performance.md#reuse-equivalent-work The installed composer and one isolated realm serve both independent phases; destination effects and two supported Windows layouts are distinct required inputs and cannot share one installation observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent clears deadlines after actual close. Timeout requests owned-tree termination and a separate ten-second close deadline fails if close remains unobserved; only that branch releases parent handles and requires the runner to retain both sandbox and installed modules. Retention is incomplete cleanup, never success. Success finally restores exact cwd/PATH before removing its verified root; offline finally restores both environment spellings. First operation and secondary cleanup errors remain separate in AggregateError.
 * @evidence contracts/portability.md#os-neutral-implementation Native path operations retain opaque percent/placeholder bytes and normalize only generated config separators. POSIX executable fixtures and Windows adjacent global/local JavaScript entry layouts exercise the actual composer dispatch. Timeout teardown targets only the owned POSIX group or Windows PID tree and records its conditional extra termination child.
 */
const test_sdk_distribution_cwd_restore = async ({
  installation,
  sandbox,
  record,
  retainResources,
}) => {
  const directory = path.join(sandbox, "sdk-distribution-cwd");
  fs.mkdirSync(directory);
  const manifest = require.resolve("@nestia/sdk/package.json", {
    paths: [installation.directory],
  });
  const composer = path.join(
    path.dirname(manifest),
    "lib/generates/internal/SdkDistributionComposer.js",
  );
  const result = await new Promise((resolve) => {
    const child = cp.spawn(
      process.execPath,
      [__filename, composer, directory],
      {
        cwd: sandbox,
        detached: process.platform !== "win32",
        windowsHide: true,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding("utf8");
      stream.on("data", (chunk) => {
        output = (output + chunk).slice(-65536);
      });
    }
    let timedOut = false;
    let launchError;
    let timeoutTerminationChildren = 0;
    let terminationError;
    let closeTimer;
    let settled = false;
    const finish = (code, signal, closeObserved) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(closeTimer);
      resolve({ code, signal, closeObserved, output, timedOut, launchError, pid: child.pid, timeoutTerminationChildren, terminationError });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      closeTimer = setTimeout(() => {
        if (settled) return;
        const reason = { operation: "sdk_distribution_cwd_restore", pid: child.pid, directory, installation: installation.directory, sandbox, closeObserved: false, exitCode: child.exitCode, signalCode: child.signalCode, timedOut: true, terminationError };
        // Retain the owner's files before releasing parent-side references.
        retainResources(reason);
        child.stdout.destroy();
        child.stderr.destroy();
        child.unref();
        finish(null, null, false);
      }, 10000);
      if (child.exitCode !== null || child.signalCode !== null) return;
      try {
        if (process.platform === "win32" && child.pid !== undefined) {
          timeoutTerminationChildren++;
          cp.execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, timeout: 10000 });
        } else if (child.pid !== undefined) process.kill(-child.pid, "SIGKILL");
      } catch (error) {
        terminationError = { name: error.name, message: error.message };
        child.kill("SIGKILL");
      }
    }, 120000);
    child.once("error", (error) => { launchError = { name: error.name, message: error.message }; });
    child.once("close", (code, signal) => finish(code, signal, true));
  });
  const phaseFile = path.join(directory, "phase-results.json");
  let phases = null;
  let phaseCaptureError;
  try { if (fs.existsSync(phaseFile)) phases = JSON.parse(fs.readFileSync(phaseFile, "utf8")); }
  catch (error) { phaseCaptureError = { name: error.name, message: error.message }; }
  record?.("sdk-distribution-cwd.json", {
    ...result,
    childRealms: result.pid === undefined ? 0 : 1,
    phases,
    phaseCaptureError,
    installerAttempts: phases?.observations?.offline?.actualInstallerExits ?? null,
  });
  assert.equal(result.timedOut, false, result.output);
  assert.equal(result.closeObserved, true, "Distribution owner close was not observed; resources retained and cleanup incomplete.");
  assert.equal(result.launchError, undefined, result.output);
  assert.equal(result.signal, null, result.output);
  assert.equal(result.code, 0, result.output);
  assert.equal(phaseCaptureError, undefined, "Distribution phase artifact capture failed.");
};

// This child body belongs to the exported boundary operation above. It uses
// actual installed methods; the parent never changes its own cwd/environment.
const exerciseOffline = async (composerPath, directory) => {
  const root = process.cwd();
  let actualInstallerExits = 0;
  const distribute = path.join(directory, "generated/packages/api");
  const cache = path.join(directory, "npm-cache");
  fs.mkdirSync(cache);
  assert.deepEqual(fs.readdirSync(cache), []);
  const overrides = {
    npm_config_offline: "true",
    npm_config_cache: cache,
    npm_config_audit: "false",
    npm_config_fund: "false",
  };
  const previous = new Map();
  let primaryError;
  const secondaryErrors = [];
  try {
    for (const [key, value] of Object.entries(overrides)) {
      for (const spelling of [key, key.toUpperCase()]) {
        previous.set(spelling, process.env[spelling]);
      }
      for (const spelling of [key, key.toUpperCase()])
        delete process.env[spelling];
      process.env[key] = value;
    }
    const composer = require(composerPath).SdkDistributionComposer;
    await assert.rejects(
      () =>
        composer.compose({
          config: { output: path.join(directory, "output"), distribute },
          mcp: false,
          websocket: false,
        }),
      (error) => {
        assert.equal(
          typeof error.status,
          "number",
          "Expected an actual installer exit.",
        );
        assert.notEqual(error.status, 0);
        assert.equal(
          error.signal,
          null,
          "A killed installer is not the offline verdict.",
        );
        assert.match(error.message, /\binstall --save-dev\b/);
        assert.match(error.message, /npm(?:-cli\.js)?/);
        actualInstallerExits++;
        return true;
      },
    );
    assert(
      fs.existsSync(path.join(distribute, "package.json")),
      "Nested package was not created before installer failure.",
    );
    assert.equal(
      process.cwd(),
      root,
      "Distribution changed the caller cwd on failure.",
    );
  } catch (error) {
    primaryError = error;
  } finally {
    for (const [key, value] of previous) {
      try {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      } catch (error) { secondaryErrors.push(error); }
    }
    try { if (process.cwd() !== root) process.chdir(root); }
    catch (error) { secondaryErrors.push(error); }
    try { fs.writeFileSync(path.join(directory, "offline-observations.json"), JSON.stringify({ actualInstallerExits })); }
    catch (error) { secondaryErrors.push(error); }
  }
  try { for (const [key, value] of previous) assert.equal(process.env[key], value); assert.equal(process.cwd(), root); }
  catch (error) { secondaryErrors.push(error); }
  if (primaryError !== undefined || secondaryErrors.length) throw new AggregateError(primaryError === undefined ? secondaryErrors : [primaryError, ...secondaryErrors], "Distribution offline or restoration failed.");
};

// The same isolated realm owns the original successful argv/cwd fixture.
const exerciseSuccess = async (composerPath, directory) => {
  const { SdkDistributionComposer } = require(composerPath);
  const equals = (title, actual, expected) => assert.deepEqual(actual, expected, title);
    const originalCwd = process.cwd();
    const originalPath = process.env.PATH;
    const root = fs.mkdtempSync(path.join(directory, "success-"));
    let helperLaunches = 0;
    let primaryError;
    const secondaryErrors = [];
    try {
      const bin = path.join(root, "bin");
      fs.mkdirSync(bin);
      const script = [
        'const fs = require("fs");',
        'const file = "npm-calls.json";',
        'const calls = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];',
        "calls.push({ args: process.argv.slice(2), cwd: process.cwd() });",
        "fs.writeFileSync(file, JSON.stringify(calls));",
      ].join("\n");
      if (process.platform === "win32") {
        fs.writeFileSync(path.join(bin, "npm.cmd"), "@echo off\n");
        fs.writeFileSync(path.join(bin, "npx.cmd"), "@echo off\n");
        const directory = path.join(bin, "node_modules/npm/bin");
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, "npm-cli.js"), script);
        fs.writeFileSync(
          path.join(directory, "npx-cli.js"),
          script.replace("npm-calls.json", "npx-calls.json"),
        );
      } else {
        const executable = path.join(bin, "npm");
        fs.writeFileSync(executable, "#!/usr/bin/env node\n" + script);
        fs.chmodSync(executable, 0o755);
        const npx = path.join(bin, "npx");
        fs.writeFileSync(
          npx,
          "#!/usr/bin/env node\n" +
            script.replace("npm-calls.json", "npx-calls.json"),
        );
        fs.chmodSync(npx, 0o755);
      }
      const versions = {
        ttsc: "^7.0.0",
        typescript: ">=7.0.0 <8.0.0",
        typia: "^14.0.0",
      };
      for (const [name, version] of Object.entries(versions)) {
        const directory = path.join(root, "node_modules", name);
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(
          path.join(directory, "package.json"),
          JSON.stringify({ name, version }),
        );
      }
      process.env.PATH = bin + path.delimiter + (originalPath ?? "");
      process.chdir(root);
      const generated = path.join(root, "generated %PATH% ${root}");
      const outputs = [
        path.join(root, "first distribution %PATH% ${output}"),
        path.join(root, "second distribution %PATH% ${output}"),
      ];
      const compositions = await Promise.allSettled(
        outputs.map((distribute) =>
          SdkDistributionComposer.compose({
            config: { output: generated, distribute },
            mcp: false,
            websocket: false,
          }),
        ),
      );
      const failures = compositions.filter(
        (result) =>
          result.status === "rejected",
      );
      if (failures.length !== 0)
        throw new AggregateError(
          failures.map((result) => result.reason),
          "Distribution compositions failed.",
        );
      equals("caller cwd preserved", process.cwd(), root);
      for (const distribute of outputs) {
        const calls = JSON.parse(
          fs.readFileSync(path.join(distribute, "npm-calls.json"), "utf8"),
        );
        equals(
          "dependency specifiers unchanged",
          calls[0].args,
          [
            "install",
            "--save-dev",
            "rimraf",
            `ttsc@${versions.ttsc}`,
            `typescript@${versions.typescript}`,
          ],
        );
        equals(
          "both child destinations",
          calls.map((call) => call.cwd),
          [distribute, distribute],
        );
        equals(
          "runtime package range",
          calls[1].args.at(-1),
          `typia@${versions.typia}`,
        );
        const tsconfig = JSON.parse(
          fs.readFileSync(path.join(distribute, "tsconfig.json"), "utf8"),
        );
        const relativeOutput = path
          .relative(distribute, generated)
          .split(path.sep)
          .join("/");
        equals(
          "compiler source directory",
          tsconfig.compilerOptions.rootDir,
          relativeOutput,
        );
        equals(
          "compiler includes generated SDK",
          tsconfig.include,
          [relativeOutput],
        );
        fs.mkdirSync(path.join(generated, "functional"), { recursive: true });
        fs.writeFileSync(path.join(generated, "functional/stale.js"), "stale");
        fs.mkdirSync(path.join(generated, "structures"), { recursive: true });
        fs.writeFileSync(
          path.join(generated, "structures/keep.ts"),
          "retained",
        );
        helperLaunches++;
        cp.execFileSync(
          process.execPath,
          [path.join(distribute, "build-sdk.cjs")],
          { cwd: distribute, stdio: "ignore" },
        );
        equals(
          "owned functional output removed",
          fs.existsSync(path.join(generated, "functional")),
          false,
        );
        equals(
          "other generated outputs preserved",
          fs.readFileSync(path.join(generated, "structures/keep.ts"), "utf8"),
          "retained",
        );
        const npxCalls = JSON.parse(
          fs.readFileSync(path.join(root, "npx-calls.json"), "utf8"),
        );
        equals("SDK generator arguments", npxCalls.at(-1).args, [
          "nestia",
          "sdk",
        ]);
        equals("SDK generator root", npxCalls.at(-1).cwd, root);
        const json = JSON.parse(
          fs.readFileSync(path.join(distribute, "package.json"), "utf8"),
        );
        json.dependencies = { "@nestia/fetcher": "1.0.0" };
        fs.writeFileSync(
          path.join(distribute, "package.json"),
          JSON.stringify(json),
        );
        await SdkDistributionComposer.compose({
          config: { output: generated, distribute },
          mcp: false,
          websocket: false,
        });
        equals(
          "configured composition no-op",
          JSON.parse(
            fs.readFileSync(path.join(distribute, "npm-calls.json"), "utf8"),
          ),
          calls,
        );
      }
      if (process.platform === "win32") {
        const localCli = path.resolve(bin, "../npm/bin");
        fs.mkdirSync(localCli, { recursive: true });
        for (const name of ["npm-cli.js", "npx-cli.js"]) {
          const globalEntry = path.join(bin, "node_modules/npm/bin", name);
          fs.copyFileSync(globalEntry, path.join(localCli, name));
          fs.unlinkSync(globalEntry);
        }
        const distribute = path.join(root, "local npm layout");
        await SdkDistributionComposer.compose({
          config: { output: generated, distribute },
          mcp: false,
          websocket: false,
        });
        const calls = JSON.parse(
          fs.readFileSync(path.join(distribute, "npm-calls.json"), "utf8"),
        );
        equals(
          "local shim dependency specifiers",
          calls[0].args,
          [
            "install",
            "--save-dev",
            "rimraf",
            `ttsc@${versions.ttsc}`,
            `typescript@${versions.typescript}`,
          ],
        );
        helperLaunches++;
        cp.execFileSync(
          process.execPath,
          [path.join(distribute, "build-sdk.cjs")],
          { stdio: "ignore" },
        );
        const npxCalls = JSON.parse(
          fs.readFileSync(path.join(root, "npx-calls.json"), "utf8"),
        );
        equals(
          "local npx shim generator arguments",
          npxCalls.at(-1).args,
          ["nestia", "sdk"],
        );
        equals(
          "local npx shim generator root",
          npxCalls.at(-1).cwd,
          root,
        );
      }
    } catch (error) {
      primaryError = error;
    } finally {
      try { process.chdir(originalCwd); } catch (error) { secondaryErrors.push(error); }
      try {
        if (originalPath === undefined) delete process.env.PATH;
        else process.env.PATH = originalPath;
      } catch (error) { secondaryErrors.push(error); }
      try {
        const observations = [];
        for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
          const calls = path.join(root, entry.name, "npm-calls.json");
          if (entry.isDirectory() && fs.existsSync(calls)) observations.push({ destination: entry.name, calls: JSON.parse(fs.readFileSync(calls, "utf8")) });
        }
        const npxFile = path.join(root, "npx-calls.json");
        const npxCalls = fs.existsSync(npxFile) ? JSON.parse(fs.readFileSync(npxFile, "utf8")) : [];
        fs.writeFileSync(path.join(directory, "success-observations.json"), JSON.stringify({ observations, observedNpmChildren: observations.reduce((sum, entry) => sum + entry.calls.length, 0), observedNpxChildren: npxCalls.length, helperLaunchAttempts: helperLaunches, npxCalls }));
      } catch (error) { secondaryErrors.push(error); }
      try { assert.equal(path.dirname(root), directory); fs.rmSync(root, { recursive: true, force: true }); }
      catch (error) { secondaryErrors.push(error); }
    }
    try { assert.equal(process.cwd(), originalCwd); assert.equal(process.env.PATH, originalPath); }
    catch (error) { secondaryErrors.push(error); }
    if (primaryError !== undefined || secondaryErrors.length) throw new AggregateError(primaryError === undefined ? secondaryErrors : [primaryError, ...secondaryErrors], "Distribution success or cleanup failed.");

};

const exercise = async (composerPath, directory) => {
  const outcomes = [];
  const describeError = (error) => ({ name: error.name, message: error.message, stack: error.stack, status: error.status, signal: error.signal, errors: error.errors?.map(describeError) });
  for (const [name, operation] of [["offline failure", exerciseOffline], ["opaque arguments success", exerciseSuccess]]) {
    const started = Date.now();
    try {
      await operation(composerPath, directory);
      outcomes.push({ name, status: "success", milliseconds: Date.now() - started });
    } catch (error) {
      outcomes.push({ name, status: "failure", milliseconds: Date.now() - started, error: describeError(error) });
      console.error(error);
    }
  }
  fs.writeFileSync(path.join(directory, "phase-results.json"), JSON.stringify({ outcomes, successAdditionalChildrenPlanned: process.platform === "win32" ? 12 : 8, existingWrapperRealms: 1, observations: Object.fromEntries(["offline", "success"].map((name) => { const file = path.join(directory, `${name}-observations.json`); return [name, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null]; })) }));
  if (outcomes.some((outcome) => outcome.status === "failure")) throw new Error("Distribution boundary phase failed.");
};

module.exports = { test_sdk_distribution_cwd_restore };
if (require.main === module)
  exercise(process.argv[2], process.argv[3]).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
