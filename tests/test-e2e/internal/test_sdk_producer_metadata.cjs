const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies the composed producer publishes the authored body type metadata.
 *
 * Reading metadata on the emitted controller proves the installed SDK
 * contributor ran alongside core's validators before generation begins.
 *
 * 1. Load the combined producer's emitted body controller.
 * 2. Read update operation metadata and require the authored parameter identity.
 * 3. Contrast its body object import with the primitive path parameter.
 * 4. Inspect the same update decorator context for bound SDK metadata and
 *    synthesized core route/body arguments in emitted JavaScript.
 *
 * @evidence contracts/testing.md#behavioral-verification Reflection reads actual injected OperationMetadata from emitted JavaScript; the input parameter must retain its named update type and body DTO import while the path id remains a different parameter. The same update decorator context must call the actual imported SDK namespace's OperationMetadata and core binding's Put with literal :id and an object argument, plus TypedBody with an object argument.
 * @evidence contracts/testing.md#independent-expectations The hand-written controller update signature names IBbsArticleBody.IUpdateBody, imports IBbsArticleBody and places id before input. These literal identities come from that source declaration, not generated output.
 * @evidence contracts/testing.md#distinguishing-cases The named object body and primitive path id are adjacent controls. Private sensitivity specimens accept valid and quoted/comment-noise envelopes while rejecting missing SDK import, quoted or nested-validator metadata spoofs, missing route/body object and duplicated metadata. Those computations run through this sole eligible export; actual requests separately own core valid-body serialization and invalid-body HTTP rejection.
 * @evidence contracts/testing.md#execution-ownership The common start entry invokes this exported assertion once immediately after its installed producer compilation; no additional native program or consumer compile is introduced.
 * @evidence contracts/e2e.md#necessary-boundary Installed compiler environment opt-in and linked SDK metadata injection must connect to actual JavaScript reflection; direct EmitTransform units cannot prove composition and module evaluation.
 * @evidence contracts/e2e.md#shared-execution This reads the one shared producer artifact before generation and reuses its actual controller module; it performs no installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The caller provides the current unique sandbox's emitted artifact root, so stale metadata from another run cannot be selected. The common entry owns module/process lifetime and sandbox cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original JavaScript core/SDK coexistence and environment activation assertions execute on this producer artifact, while exact IBbsArticle.IUpdate/import IBbsArticle remain in native authored units. This producer selects core-only plus environment opt-in; the old two-descriptor linked-plugin selection remains a distinct direct native owner. Its rich DTO rename, void return and configured validator mode are not asserted to be identical source premises. Existing body requests own runtime validation separately.
 * @evidence contracts/common.md#principled-implementation The sole producer artifact supplies structural emission and evaluated metadata. Private tokenization makes quoted payloads/comments and expression-prefix regexes opaque; delimiter pairs/depths identify top-level require bindings, exact update __decorate arguments and actual decorator items or __param wrappers. Indexed nested ranges prevent validator-body calls from satisfying the envelope. Its stated grammar is this emitter's CommonJS initializers, ASCII binding/helper names, JSON-compatible quoted strings and flat templates; arbitrary nested templates or universal JavaScript lexical support are not claimed. Independent private sensitivity specimens distinguish false bound-call evidence.
 * @evidence contracts/common.md#clear-and-simple-design One existing export delegates private tokenization, indexed envelope inspection and bounded sensitivity checks while retaining reflection assertions. The nested argument helper returns half-open ranges without copying expressions; binding maps and paired delimiters keep import/context decisions in one inspector without another producer phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the current emitted file without patching artifacts, module loaders or compiler internals; literal controller/route expectations belong to this authored test.
 * @evidence contracts/common.md#meaningful-documentation The export explains artifact/reflection ownership and original-selection/DTO differences. Ordinary private comments describe constrained grammar, payload opacity, delimiter-range splitting and sensitivity preparation; their responsibility is reviewed through this eligible owner rather than unsupported private annotation hosts.
 * @evidence contracts/performance.md#efficient-algorithms The artifact is read once. Private forward character scanning, delimiter/depth indexing, fixed initializer recognition and decorator discovery each take linear time and space in artifact size. Argument scans skip indexed nested ranges instead of rescanning validator bodies; fixed bounded sensitivity specimens add constant work relative to artifact size. Reflection reads the same module once.
 * @evidence contracts/performance.md#reuse-equivalent-work Both emission and reflection consume the same unique producer output without a second compiler/generator. Private inspections reuse the one token result, delimiter index and binding map for the immutable source. Distinct negative specimens are not equivalent inputs and require their own bounded judgments; no cross-run cache is introduced.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns sandbox/module lifetime; private token/range/map arrays and sensitivity strings are invocation-local, with no handles, tasks or input-dependent historical state retained afterward.
 * @evidence contracts/portability.md#os-neutral-implementation path.join combines the caller's native producer root with the emitted relative controller path for file reading and module loading. readFileSync closes its descriptor before returning the string; no shell quoting, hard-coded drive or separator replacement is used. Private token/range/sensitivity computations receive immutable strings and acquire no native path, filesystem or process boundary.
 */
const test_sdk_producer_metadata = (producer) => {
  verifyEnvelopeSensitivity();
  const artifact = path.join(producer, "scenarios/body/controllers/TypedBodyController.js");
  inspectUpdateEmission(fs.readFileSync(artifact, "utf8"));
  const { TypedBodyController } = require(artifact);
  const metadata = Reflect.getMetadata("nestia/OperationMetadata", TypedBodyController.prototype, "update");
  assert.ok(metadata, "SDK contributor did not publish update metadata.");
  const input = metadata.parameters.find((parameter) => parameter.name === "input");
  const id = metadata.parameters.find((parameter) => parameter.name === "id");
  assert.ok(input, "Update body parameter metadata is absent.");
  assert.ok(id, "Update path parameter metadata is absent.");
  assert.equal(input.index, 1);
  assert.equal(id.index, 0);
  assert.ok(input.type, "The authored named body type is absent.");
  assert.equal(input.type.name, "IBbsArticleBody.IUpdateBody");
  assert.ok(input.imports.some((entry) => entry.elements.includes("IBbsArticleBody")));
  assert.notEqual(id.type?.name, input.type.name);
};

/**
 * Inspects this compiler's top-level CommonJS update decorator envelope.
 *
 * This is not a JavaScript parser. The supported artifact has emitter-created
 * require initializers, an ASCII helper/binding envelope, JSON-compatible
 * double-quoted strings and flat template literals. Regex literal recognition
 * uses expression-prefix positions; arbitrary nested templates and general
 * JavaScript lexical contexts are outside this scanner's claim.
 *
 */
const inspectUpdateEmission = (source) => {
  const tokens = emittedTokens(source);
  const pairs = new Map();
  const stack = [];
  const depths = [];
  for (let i = 0; i < tokens.length; i++) {
    depths[i] = stack.length;
    const text = tokens[i].text;
    if (["(", "[", "{"].includes(text)) stack.push(i);
    else if ([")", "]", "}"].includes(text)) {
      const start = stack.pop();
      assert.notEqual(start, undefined, "Unbalanced producer artifact.");
      assert.equal({ "(": ")", "[": "]", "{": "}" }[tokens[start].text], text);
      pairs.set(start, i);
    }
  }
  assert.equal(stack.length, 0, "Unbalanced producer artifact.");
  const bindings = new Map();
  for (let i = 0; i < tokens.length; i++) {
    if (depths[i] !== 0 || !["const", "let", "var"].includes(tokens[i].text) || tokens[i + 2]?.text !== "=") continue;
    const binding = tokens[i + 1].text;
    let j = i + 3;
    if (["__importStar", "__importDefault"].includes(tokens[j]?.text) && tokens[j + 1]?.text === "(") j += 2;
      if (tokens[j]?.text === "require" && tokens[j + 1]?.text === "(" && pairs.get(j + 1) === j + 3) {
        const module = tokens[j + 2].value;
        if (module === "@nestia/core" || module === "@nestia/sdk") bindings.set(module, binding);
      }
  }
  assert.ok(bindings.has("@nestia/core"), "Emitted core import is absent.");
  assert.ok(bindings.has("@nestia/sdk"), "Emitted SDK namespace import is absent.");
  /**
   * Splits one indexed emitted argument/list envelope at its own commas.
   *
   */
  const argsOf = (open) => {
    const args = [];
    let start = open + 1;
    for (let i = start; i < pairs.get(open); i++) {
      if (tokens[i].text === ",") { args.push([start, i]); start = i + 1; }
      else if (pairs.has(i)) i = pairs.get(i);
    }
    args.push([start, pairs.get(open)]);
    return args;
  };
  const contexts = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].text !== "__decorate" || tokens[i + 1]?.text !== "(") continue;
    const args = argsOf(i + 1);
    if (args.length !== 4) continue;
    const target = tokens.slice(...args[1]).map((token) => token.text).join("");
    if (target === "TypedBodyController.prototype" && args[2][1] === args[2][0] + 1 && tokens[args[2][0]].value === "update") contexts.push(args[0]);
  }
  assert.equal(contexts.length, 1, "Exactly one update decorator context is required.");
  const [start, end] = contexts[0];
  assert.equal(tokens[start].text, "[");
  assert.equal(pairs.get(start), end - 1);
  const calls = { route: 0, body: 0, metadata: 0 };
  for (const [decoratorStart, decoratorEnd] of argsOf(start)) {
    let i = decoratorStart;
    let callEnd = decoratorEnd;
    let parameterIndex;
    if (tokens[i]?.text === "__param" && tokens[i + 1]?.text === "(") {
      assert.equal(pairs.get(i + 1), decoratorEnd - 1);
      const wrapper = argsOf(i + 1);
      assert.equal(wrapper.length, 2);
      assert.equal(wrapper[0][1], wrapper[0][0] + 1);
      parameterIndex = tokens[wrapper[0][0]].text;
      [i, callEnd] = wrapper[1];
    }
    const owner = tokens[i].text;
    if (owner !== bindings.get("@nestia/core") && owner !== bindings.get("@nestia/sdk")) continue;
    let j = i + 1;
    const members = [];
    while (tokens[j]?.text === ".") { members.push(tokens[j + 1]?.text); j += 2; }
    if (tokens[j]?.text !== "(") continue;
    assert.equal(pairs.get(j), callEnd - 1);
    const args = argsOf(j);
    const member = members.join(".");
    if (owner === bindings.get("@nestia/core") && ["default.TypedRoute.Put", "TypedRoute.Put"].includes(member)) {
      assert.equal(args.length, 2);
      assert.equal(args[0][1], args[0][0] + 1);
      assert.equal(tokens[args[0][0]].value, ":id");
      assert.equal(tokens[args[1][0]].text, "{");
      assert.equal(pairs.get(args[1][0]), args[1][1] - 1);
      calls.route++;
    } else if (owner === bindings.get("@nestia/core") && ["default.TypedBody", "TypedBody"].includes(member)) {
      assert.equal(parameterIndex, "1", "The update input owns TypedBody.");
      assert.equal(args.length, 1);
      assert.equal(tokens[args[0][0]].text, "{");
      assert.equal(pairs.get(args[0][0]), args[0][1] - 1);
      calls.body++;
    } else if (owner === bindings.get("@nestia/sdk") && member === "OperationMetadata") {
      assert.equal(args.length, 1);
      assert.equal(args[0][1], args[0][0] + 1);
      assert.equal(typeof tokens[args[0][0]].value, "string");
      const metadata = JSON.parse(tokens[args[0][0]].value);
      assert.equal(metadata.parameters[1].type.name, "IBbsArticleBody.IUpdateBody");
      calls.metadata++;
    }
  }
  assert.deepEqual(calls, { route: 1, body: 1, metadata: 1 });
};

/**
 * Tokenizes the constrained emitted envelope while treating payloads as opaque.
 *
 */
const emittedTokens = (source) => {
  const tokens = [];
  for (let i = 0; i < source.length;) {
    const char = source[i];
    if (/\s/.test(char)) { i++; continue; }
    if (source.startsWith("//", i)) { const end = source.indexOf("\n", i + 2); i = end === -1 ? source.length : end; continue; }
    if (source.startsWith("/*", i)) { const end = source.indexOf("*/", i + 2); assert.notEqual(end, -1); i = end + 2; continue; }
    if (["\"", "'", "`"].includes(char)) {
      const start = i++;
      while (i < source.length && source[i] !== char) { if (source[i] === "\\") i++; i++; }
      assert.ok(i < source.length, "Unterminated emitted string.");
      const text = source.slice(start, ++i);
      let value;
      if (char === "\"") value = JSON.parse(text);
      else if (char === "'" && !text.includes("\\")) value = text.slice(1, -1);
      tokens.push({ text, value });
      continue;
    }
    const previous = tokens.at(-1)?.text;
    if (char === "/" && [undefined, "(", "=", ":", ",", "[", "!", "?", "return", ">", "&", "|"].includes(previous)) {
      i++;
      let bracket = false;
      for (; i < source.length; i++) {
        if (source[i] === "\\") { i++; continue; }
        if (source[i] === "[") bracket = true;
        else if (source[i] === "]") bracket = false;
        else if (source[i] === "/" && !bracket) break;
      }
      assert.ok(i < source.length, "Unterminated emitted regex.");
      i++;
      while (/[a-z]/i.test(source[i] ?? "")) i++;
      tokens.push({ text: "regex" });
      continue;
    }
    if (/[$_\p{ID_Start}]/u.test(char)) {
      const start = i++;
      while (i < source.length && /[$_\u200C\u200D\p{ID_Continue}]/u.test(source[i])) i++;
      tokens.push({ text: source.slice(start, i) });
    } else tokens.push({ text: char }), i++;
  }
  return tokens;
};

/**
 * Checks envelope sensitivity with authored valid and one-change negative twins.
 *
 */
const verifyEnvelopeSensitivity = () => {
  const imports = 'const coreAlias = __importDefault(require("@nestia/core")); const sdkAlias = __importStar(require("@nestia/sdk"));';
  const payload = JSON.stringify(JSON.stringify({ parameters: [{}, { type: { name: "IBbsArticleBody.IUpdateBody" } }] }));
  const metadata = `sdkAlias.OperationMetadata(${payload})`;
  const route = 'coreAlias.default.TypedRoute.Put(":id", {})';
  const body = '__param(1, coreAlias.default.TypedBody({}))';
  const envelope = (prefix, entries) => `${prefix} __decorate([${entries}], TypedBodyController.prototype, "update", null);`;
  const valid = envelope(imports, `${route}, ${body}, ${metadata}`);
  assert.doesNotThrow(() => inspectUpdateEmission(valid));
  assert.doesNotThrow(() => inspectUpdateEmission(`/* { fake } */ const noise = "sdkAlias.OperationMetadata({})"; ${valid}`));
  for (const invalid of [
    envelope(imports.split(';')[0] + ';', `${route}, ${body}, ${metadata}`),
    envelope(imports, `${route}, ${body}, ${JSON.stringify(metadata)}`),
    envelope(imports, `${route}, __param(1, coreAlias.default.TypedBody({check: () => ${metadata}}))`),
    envelope(imports, `${route.replace(', {}', '')}, ${body}, ${metadata}`),
    envelope(imports, `${route}, ${body.replace('TypedBody({})', 'TypedBody()')}, ${metadata}`),
    envelope(imports, `${route}, ${body}, ${metadata}, ${metadata}`),
  ]) assert.throws(() => inspectUpdateEmission(invalid), assert.AssertionError);
};

module.exports = { test_sdk_producer_metadata };
