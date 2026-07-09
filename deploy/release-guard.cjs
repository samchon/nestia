#!/usr/bin/env node
"use strict";

const childProcess = require("child_process");
const fs = require("fs");

const STABLE_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const PRERELEASE_PATTERNS = {
  rc: {
    pattern:
      /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)-rc\.(0|[1-9][0-9]*)$/,
    example: "12.0.0-rc.3",
  },
  next: {
    pattern:
      /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)-next\.(0|[1-9][0-9]*)$/,
    example: "12.0.0-next.0",
  },
};

const command = process.argv[2];

const fail = (message) => {
  console.error(`::error::${message}`);
  process.exit(1);
};

const exportEnvironment = (entries) => {
  const text = Object.entries(entries)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  if (process.env.GITHUB_ENV)
    fs.appendFileSync(process.env.GITHUB_ENV, `${text}\n`);
  else console.log(text);
};

const isReleasePackageJson = (file) =>
  file === "package.json" ||
  file === "benchmark/package.json" ||
  file === "config/package.json" ||
  file === "packages/sdk/assets/bundle/distribute/package.json" ||
  /^packages\/[^/]+\/package\.json$/.test(file) ||
  /^tests\/[^/]+\/package\.json$/.test(file);

const packageJsonFiles = () =>
  childProcess
    .execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter((file) => file.endsWith("package.json"))
    .filter(isReleasePackageJson);

const rewritePackageVersions = (version) => {
  for (const file of packageJsonFiles()) {
    const text = fs.readFileSync(file, "utf8");
    const json = JSON.parse(text);
    if (!json.version || json.version === "0.0.0") continue;
    if (json.version === version) continue;
    json.version = version;
    fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  }
};

const assertPackageVersions = (version) => {
  if (!version) fail("RELEASE_VERSION is required");
  const mismatches = [];
  for (const file of packageJsonFiles()) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (json.version && json.version !== "0.0.0" && json.version !== version)
      mismatches.push(`${file}: ${json.version}`);
  }
  if (mismatches.length) {
    console.error(`Release package versions must all be ${version}:`);
    for (const line of mismatches) console.error(`- ${line}`);
    process.exit(1);
  }
};

const validateContext = () => {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const refName = process.env.GITHUB_REF_NAME ?? "";

  if (eventName === "push") {
    const match = /^v(.+)$/.exec(refName);
    if (!match || !STABLE_VERSION.test(match[1]))
      fail("release tag must be stable vX.Y.Z, for example v12.0.0");
    assertPackageVersions(match[1]);
    exportEnvironment({ NPM_TAG: "latest", RELEASE_VERSION: match[1] });
    return;
  }

  if (eventName === "workflow_dispatch") {
    const tag = process.env.INPUT_TAG;
    const version = process.env.INPUT_VERSION;
    if (refName !== "next")
      fail("manual prerelease publishing must run from next");
    const rule = PRERELEASE_PATTERNS[tag];
    if (!rule) fail("tag must be rc or next");
    if (!rule.pattern.test(version))
      fail(`tag '${tag}' requires version like ${rule.example}`);
    exportEnvironment({ NPM_TAG: tag, RELEASE_VERSION: version });
    return;
  }

  fail(`unsupported release event: ${eventName}`);
};

const bumpIfNeeded = () => {
  const version = process.env.RELEASE_VERSION;
  if (!version) fail("RELEASE_VERSION is required");
  const current = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
  if (current !== version)
    childProcess.execFileSync(
      "pnpm",
      [
        "bumpp",
        version,
        "--no-commit",
        "--no-tag",
        "--no-push",
        "--recursive",
        "--yes",
      ],
      { stdio: "inherit" },
    );
  else console.log(`Version is already ${version}.`);
  rewritePackageVersions(version);
};

switch (command) {
  case "validate-context":
    validateContext();
    break;
  case "bump-if-needed":
    bumpIfNeeded();
    break;
  case "validate-package-versions":
    assertPackageVersions(process.env.RELEASE_VERSION);
    break;
  default:
    fail(
      "usage: release-guard.cjs <validate-context|bump-if-needed|validate-package-versions>",
    );
}
