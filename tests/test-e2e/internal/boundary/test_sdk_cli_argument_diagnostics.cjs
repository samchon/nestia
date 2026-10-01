const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies 설치 CLI가 누락된 flag 값의 소유자를 진단한다.
 *
 * 앞선 --watch 또는 --project 값이 있어도 마지막 flag의 누락을
 * 구별해야 한다. 값이 있는 control은 이후 설정 로딩까지 진행한다.
 *
 * 1. 여섯 잘못된 argv를 같은 설치의 실제 CLI로 실행한다.
 * 2. flag별 literal 진단, 실패 status와 TypeError 부재를 확인한다.
 * 3. 제공된 config 값은 누락으로 판정하지 않는지 확인한다.
 *
 * @evidence contracts/testing.md#behavioral-verification 설치 nestia binary가 실제 argv parsing으로 config/project 값 누락을 진단하고 실패한다. 정상 값 control은 누락 진단 없이 다음 설정 부재에서 실패한다.
 * @evidence contracts/testing.md#independent-expectations config file must be provided 및 project file must be provided는 CLI flag의 공개 입력 계약에 따른 literal oracle이다. 명시적인 nestia.config.ts 값은 missing value가 아니다.
 * @evidence contracts/testing.md#distinguishing-cases sole flag, preceding watch, preceding valued project, following flag의 여섯 원 argv와 정상 값 control을 모두 보존하며 endsWith TypeError와 항상 거절하는 guard를 구별한다.
 * @evidence contracts/testing.md#execution-ownership sole E2E entry가 이 파일과 같은 이름의 export를 공통 설치 준비 후 한 번 호출하고 case failure를 독립 기록한다.
 * @evidence contracts/e2e.md#necessary-boundary 설치 executable dispatch와 실제 process argv 연결은 parser unit만으로 확인되지 않는다. 실행 실패와 제품 진단 실패를 구분하며 foreign process methods를 교체하지 않는다.
 * @evidence contracts/e2e.md#shared-execution 일곱 argv는 같은 packed installation을 사용한다. executable argv가 독립 process 시작 입력이므로 각각 별도 CLI lifetime이 필요하나 compiler와 backend는 준비하지 않는다.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity 설정이 없는 전용 sandbox 하위 cwd를 사용한다. 각 child의 stdout/stderr를 소유하고 close까지 기다리며 최종 공통 teardown이 cwd를 삭제한다.
 * @evidence contracts/e2e.md#preserved-coverage 원 runCliArgumentDiagnosticsFeature의 여섯 literal diagnostics와 endsWith 부재 및 supplied config control을 모두 유지하고 nonzero exit verdict를 강화한다.
 */
const test_sdk_cli_argument_diagnostics = async ({ installation, sandbox }) => {
  const cwd = path.join(sandbox, "cli-argument-diagnostics");
  fs.mkdirSync(cwd);
  const binary = installation.binary("nestia", "nestia");
  const invoke = (args) => new Promise((resolve, reject) => {
    const child = cp.spawn(process.execPath, [binary, ...args], {
      cwd, env: { ...process.env }, windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ output, code, signal }));
  });
  const cases = [
    [["swagger", "--config"], "config file must be provided"],
    [["swagger", "--watch", "--config"], "config file must be provided"],
    [["sdk", "--project", "tsconfig.json", "--config"], "config file must be provided"],
    [["sdk", "--project"], "project file must be provided"],
    [["swagger", "--watch", "--project"], "project file must be provided"],
    [["swagger", "--config", "--watch"], "config file must be provided"],
  ];
  const failures = [];
  for (const [args, message] of cases) {
    try {
      const result = await invoke(args);
      assert.equal(result.signal, null, args.join(" "));
      assert.notEqual(result.code, 0, args.join(" "));
      assert.ok(result.output.includes(message), `${args.join(" ")}: ${result.output}`);
      assert.equal(result.output.includes("endsWith"), false, result.output);
    } catch (error) { failures.push(error); }
  }
  try {
    const control = await invoke(["swagger", "--config", "nestia.config.ts"]);
    assert.equal(control.signal, null);
    assert.notEqual(control.code, 0, "The missing configuration control unexpectedly succeeded.");
    assert.equal(control.output.includes("must be provided"), false, control.output);
    assert.equal(control.output.includes("endsWith"), false, control.output);
  } catch (error) { failures.push(error); }
  if (failures.length) throw new AggregateError(failures, "Installed CLI argument diagnostics failed.");
};

module.exports = { test_sdk_cli_argument_diagnostics };
