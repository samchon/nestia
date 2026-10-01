const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies 설치 dependencies 명령이 연결된 typia version을 정확히 저장한다.
 *
 * 공개 manager override의 실제 argv는 명령 작성과 executable dispatch를
 * 함께 검증한다. registry의 최신 typia를 선택하면 release 연결이 깨진다.
 *
 * 1. 같은 설치 CLI에 명령 기록용 공개 manager를 지정한다.
 * 2. 실제 manager process가 기록한 세 argv 배열을 확인한다.
 * 3. typia 버전과 -E가 설치 core의 연결 버전에 일치하는지 확인한다.
 *
 * @evidence contracts/testing.md#behavioral-verification 설치 nestia dependencies 명령이 실제 공개 manager process를 호출하고 e2e/fetcher 및 exact typia install argv를 전달한다.
 * @evidence contracts/testing.md#independent-expectations 설치 core 위치에서 resolve한 typia manifest version과 공개 exact-save 계약이 typia@version 및 -E의 독립 oracle이다. manager 출력에서 기대값을 만들지 않는다.
 * @evidence contracts/testing.md#distinguishing-cases 세 distinct package 명령을 정확한 순서와 배열로 비교하므로 typia bare/latest, 누락된 -E, package 또는 추가 command를 구별한다.
 * @evidence contracts/testing.md#execution-ownership sole E2E entry가 공통 설치 후 matching export를 한 번 호출한다. 명령 기록 manager는 명시적인 CLI extension boundary이고 portable rule unit 대체를 주장하지 않는다.
 * @evidence contracts/e2e.md#necessary-boundary 설치 executable의 dependencies dispatch와 공개 manager process argv 전달은 직접 문자열 작성 unit으로 증명할 수 없다.
 * @evidence contracts/e2e.md#shared-execution 같은 packed installation의 binary와 typia를 사용하고 compiler/backend/install은 추가하지 않는다. 한 CLI와 세 manager process lifetime만 명령 전달을 확인한다.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity 전용 sandbox 하위 폴더와 log를 사용하고 CLI close 이후 log를 읽는다. 공개 override만 사용하며 cwd와 환경 전역을 바꾸지 않는다. 공통 teardown이 파일을 삭제한다.
 * @evidence contracts/e2e.md#preserved-coverage 원 runCliDependenciesFeature의 세 exact argv, 연결된 typia version과 -E control을 유지하며 실제 CLI status와 signal도 확인한다.
 */
const test_sdk_cli_dependencies = async ({ installation, sandbox }) => {
  const cwd = path.join(sandbox, "cli-dependencies");
  fs.mkdirSync(cwd);
  const log = path.join(cwd, "commands.jsonl");
  const manager = path.join(cwd, "manager.cjs");
  fs.writeFileSync(manager, `require("node:fs").appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + "\\n");`);
  const binary = installation.binary("nestia", "nestia");
  await new Promise((resolve, reject) => {
    const child = cp.spawn(process.execPath, [binary, "dependencies", "--manager", "node manager.cjs"], {
      cwd, env: { ...process.env }, windowsHide: true, stdio: "inherit",
    });
    child.once("error", reject);
    child.once("close", (code, signal) => code === 0 && signal === null
      ? resolve() : reject(new Error(`Installed dependencies CLI failed: ${signal ?? code}`)));
  });
  const core = path.dirname(require.resolve("@nestia/core/package.json", { paths: [installation.directory] }));
  const manifest = JSON.parse(fs.readFileSync(require.resolve("typia/package.json", { paths: [core] }), "utf8"));
  const commands = fs.readFileSync(log, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  assert.deepEqual(commands, [
    ["install", "@nestia/e2e"],
    ["install", "@nestia/fetcher"],
    ["install", `typia@${manifest.version}`, "-E"],
  ]);
};

module.exports = { test_sdk_cli_dependencies };
