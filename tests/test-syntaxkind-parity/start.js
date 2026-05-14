// Parity check: the factory's hardcoded SyntaxKind / NodeFlags numerics
// must agree with the workspace `typescript` package the user actually
// imports at compile time. A drift means factory emits code keyed off
// kind N while tsc/ttsc expects kind M, silently producing wrong output.
//
// Owned jointly with the ts-surface / typescript-evolution review agents.
// Companion to the Go-side `core_transform.go:81` symbolic adoption of
// `shimast.KindDecorator` landed in cycle 1.

const ts = require("typescript");
const factory = require("@nestia/factory");

const FAILURES = [];

function compare(table, factoryTable, label) {
  for (const key of Object.keys(factoryTable)) {
    const factoryValue = factoryTable[key];
    const tsValue = table[key];
    if (typeof tsValue !== "number") {
      FAILURES.push(
        `${label}: factory has "${key}" = ${factoryValue} but the workspace ` +
          `typescript@${ts.version} does not expose "${key}".`,
      );
      continue;
    }
    if (tsValue !== factoryValue) {
      FAILURES.push(
        `${label}: drift on "${key}" — factory=${factoryValue} ` +
          `vs typescript@${ts.version}=${tsValue}.`,
      );
    }
  }
}

compare(ts.SyntaxKind, factory.SyntaxKind, "SyntaxKind");
compare(ts.NodeFlags, factory.NodeFlags, "NodeFlags");

if (FAILURES.length === 0) {
  console.log(
    `parity OK: @nestia/factory SyntaxKind / NodeFlags match typescript@${ts.version}.`,
  );
  process.exit(0);
}

console.error(`parity FAIL: ${FAILURES.length} mismatch(es) found.`);
for (const line of FAILURES) console.error(`  - ${line}`);
console.error(
  "\nIf you bumped the workspace `typescript` catalog, " +
    "update packages/factory/src/constants/SyntaxKind.ts and NodeFlags.ts " +
    "to match. See packages/core/MIGRATION.md for the coupling diagram.",
);
process.exit(1);
