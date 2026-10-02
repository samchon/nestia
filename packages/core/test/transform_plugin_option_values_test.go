package test

import (
	"strings"
	"testing"
)

// TestTransformPluginOptionValues verifies an unknown validate or stringify
// option value fails the build with a diagnostic, and every documented value
// builds.
//
// The options were read as free strings, so a value matching no mode took each
// generator's default branch: "assertEqual" (for "assertEquals") built cleanly
// with extra properties allowed (#1727).
//
//  1. Transform an authored response controller with each documented value.
//  2. Transform it with a misspelled validate and a misspelled stringify.
//  3. Assert the documented values exit 0 and the misspelled ones exit 3,
//     naming the option and the value.
//
// @evidence contracts/testing.md#behavioral-verification Every supported option form must transform successfully; malformed validate and stringify values must return exit 3 with the responsible option text and no successful output. Foreign plugin options must not be mistaken for core options, and a valid call after rejection must succeed.
// @evidence contracts/testing.md#independent-expectations The ten validate modes, five stringify modes and nullable stringify are the public option unions. Authored JSON values outside those unions must be rejected independently of helper implementation.
// @evidence contracts/testing.md#distinguishing-cases All supported modes, omission, nullable stringify, misspellings, boolean/number/null/object/array invalid values, foreign-plugin isolation and rejection recovery distinguish option validation; runtime E2E owns generated validator execution.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and invokes the source-to-source operation in-process on a minimal authored declaration/DTO. It does not build a consumer JavaScript program, execute Node, install dependencies or launch a native host.
func TestTransformPluginOptionValues(t *testing.T) {
	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
	run := func(config string) (string, int) {
		stdout, stderr, code := runCoreNative([]string{
			"transform",
			"--cwd", project.Root,
			"--tsconfig", "tsconfig.json",
			"--file", "src/main.ts",
			"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform",` + config + `}}]`,
		})
		if code == 3 && strings.TrimSpace(stdout) != "" {
			t.Errorf("invalid options %s published transformed source: %s", config, stdout)
		}
		return stderr, code
	}
	configs := []string{`"stringify":null`, `"llm":false`}
	for _, mode := range []string{"assert", "is", "validate", "assertEquals", "equals", "validateEquals", "assertClone", "validateClone", "assertPrune", "validatePrune"} {
		configs = append(configs, `"validate":"`+mode+`"`)
	}
	for _, mode := range []string{"assert", "is", "validate", "stringify", "validate.log"} {
		configs = append(configs, `"stringify":"`+mode+`"`)
	}
	for _, config := range configs {
		if stderr, code := run(config); code != 0 {
			t.Errorf("%s should build, got %d:\n%s", config, code, stderr)
		}
	}
	for config, needle := range map[string]string{
		`"validate":"assertEqual"`: `invalid "validate" option "assertEqual"`,
		`"stringify":"assertX"`:    `invalid "stringify" option "assertX"`,
		`"validate":true`:          `invalid "validate" option true`,
		`"validate":null`:          `invalid "validate" option <nil>`,
		`"validate":1`:             `invalid "validate" option 1`,
		`"validate":{}`:            `invalid "validate" option map[]`,
		`"validate":[]`:            `invalid "validate" option []`,
		`"stringify":false`:        `invalid "stringify" option false`,
		`"stringify":{}`:           `invalid "stringify" option map[]`,
		`"stringify":[]`:           `invalid "stringify" option []`,
	} {
		stderr, code := run(config)
		if code != 3 || strings.Contains(stderr, needle) == false {
			t.Errorf("%s should fail with %q, got %d:\n%s", config, needle, code, stderr)
		}
		if stderr, code := run(`"validate":"assert","stringify":"assert"`); code != 0 {
			t.Errorf("valid options after %s failed (%d): %s", config, code, stderr)
		}
	}
	_, stderr, code := runCoreNative([]string{"transform", "--cwd", project.Root, "--tsconfig", "tsconfig.json", "--file", "src/main.ts", "--plugins-json", `[{"name":"foreign","config":{"validate":true,"stringify":false}},{"name":"@nestia/core","config":{}}]`})
	if code != 0 {
		t.Errorf("foreign options affected core (%d): %s", code, stderr)
	}
}
