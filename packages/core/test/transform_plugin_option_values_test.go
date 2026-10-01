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
//  1. Transform the body feature's controller with each documented value.
//  2. Transform it with a misspelled validate and a misspelled stringify.
//  3. Assert the documented values exit 0 and the misspelled ones exit 3,
//     naming the option and the value.
//
// @evidence contracts/testing.md#behavioral-verification Four supported option forms must succeed and three malformed forms must return exit 3 with their specific invalid-option text; silently accepting typos or rejecting valid modes fails.
// @evidence contracts/testing.md#independent-expectations The supported validate/stringify union includes assertEquals, validatePrune, validate.log and null; assertEqual, assertX and true lie outside that public contract.
// @evidence contracts/testing.md#distinguishing-cases The table covers supported aliases, null, near misspellings and a wrong primitive type; assertGuard has a dedicated rejection and runtime mode tests own helper behavior.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformPluginOptionValues(t *testing.T) {
	const feature = "body"
	run := func(config string) (string, int) {
		temp := t.TempDir()
		root := featureRootForCore(t, feature)
		controller := featureSource(t, feature, "controllers/TypedBodyController.ts")
		tsconfig := writeExtendingTsconfig(t, temp, root, "", []string{controller})
		_, stderr, code := runCoreNative([]string{
			"transform",
			"--cwd", temp,
			"--tsconfig", tsconfig,
			"--file", controller,
			"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform",` + config + `}}]`,
		})
		return stderr, code
	}
	for _, config := range []string{
		`"validate":"assertEquals"`,
		`"validate":"validatePrune"`,
		`"stringify":"validate.log"`,
		`"stringify":null`,
	} {
		if stderr, code := run(config); code != 0 {
			t.Errorf("%s should build, got %d:\n%s", config, code, stderr)
		}
	}
	for config, needle := range map[string]string{
		`"validate":"assertEqual"`: `invalid "validate" option "assertEqual"`,
		`"stringify":"assertX"`:    `invalid "stringify" option "assertX"`,
		`"validate":true`:          `invalid "validate" option true`,
	} {
		stderr, code := run(config)
		if code != 3 || strings.Contains(stderr, needle) == false {
			t.Errorf("%s should fail with %q, got %d:\n%s", config, needle, code, stderr)
		}
	}
}
