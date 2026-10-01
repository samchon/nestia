/**
 * Handwritten URI-version controls shared by the two route-policy consumers.
 *
 * Nest's RoutePathFactory selects method metadata before controller metadata;
 * an explicit array, including an empty one, is present. Defaults apply when
 * both metadata values are absent. Neutral versions contribute no URI segment.
 *
 * @evidence contracts/testing.md#behavioral-verification These cases are consumed by separate core and SDK units that call their built route policies. A wrong precedence, empty-list fallback or neutral mapping changes an asserted segment list.
 * @evidence contracts/testing.md#independent-expectations Literal expected segments follow Nest URI routing precedence and the installed RoutePathFactory empty-array control, rather than either nestia implementation or a source-text comparison.
 * @evidence contracts/testing.md#distinguishing-cases Controls cover absent and empty metadata, method override, controller fallback, configured defaults, duplicate versions, neutral values, disabled versioning and a custom prefix.
 * @evidence contracts/testing.md#execution-ownership This shared fixture factory is called in each package's matching unit export; it starts no process, compiler, installation or server and retains no cross-test state.
 */
const routeVersionContract = (neutral) => [
  {
    name: "absent",
    config: { prefix: "v" },
    controller: undefined,
    method: undefined,
    expected: [""],
  },
  {
    name: "default",
    config: { prefix: "v", defaultVersion: "3" },
    controller: undefined,
    method: undefined,
    expected: ["v3"],
  },
  {
    name: "controller",
    config: { prefix: "v", defaultVersion: "3" },
    controller: ["1"],
    method: undefined,
    expected: ["v1"],
  },
  {
    name: "method override",
    config: { prefix: "v" },
    controller: ["1"],
    method: ["2"],
    expected: ["v2"],
  },
  {
    name: "empty method",
    config: { prefix: "v", defaultVersion: "3" },
    controller: ["1"],
    method: [],
    expected: [],
  },
  {
    name: "empty controller",
    config: { prefix: "v", defaultVersion: "3" },
    controller: [],
    method: undefined,
    expected: [],
  },
  {
    name: "empty default",
    config: { prefix: "v", defaultVersion: [] },
    controller: undefined,
    method: undefined,
    expected: [],
  },
  {
    name: "neutral and duplicate",
    config: { prefix: "v" },
    controller: undefined,
    method: [neutral, "2", "2", neutral],
    expected: ["", "v2"],
  },
  {
    name: "neutral default",
    config: { prefix: "v", defaultVersion: neutral },
    controller: undefined,
    method: undefined,
    expected: [""],
  },
  {
    name: "custom prefix",
    config: { prefix: "revision-" },
    controller: undefined,
    method: ["2"],
    expected: ["revision-2"],
  },
  {
    name: "disabled",
    config: undefined,
    controller: ["1"],
    method: [],
    expected: [""],
  },
];

module.exports = { routeVersionContract };
