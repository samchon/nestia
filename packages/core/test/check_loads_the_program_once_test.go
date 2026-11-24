package test

import (
	"strings"
	"testing"
)

// TestCheckLoadsTheProgramOnce verifies an analysis-only check runs the
// transforms on the Program it diagnosed, without a second load or an emit.
//
// The transforms are part of tsgo's emit pipeline, which a noEmit Program
// skips, so check used to load the project again with emit forced and print
// every file only to discard the JavaScript. The profile steps are the
// command's own report of what it did: one load step, the analysis transform
// step, and no emit step. The tuple project is the twin that must still fail
// through those transforms, so a check that skipped them would not pass.
//
//  1. Enable the command profile and check a valid TypedRoute project.
//  2. Require exit 0, one load step, the analysis transform step and no emit.
//  3. Check the tuple project: the LLM diagnostic still fails it with exit 3
//     after the same single load.
//
// @evidence contracts/testing.md#behavioral-verification The check dispatcher runs in-process with TTSC_NESTIA_PROFILE set; its exit status, its profile step lines on stderr and the LLM diagnostic are asserted for a valid and a failing project.
// @evidence contracts/testing.md#independent-expectations Each profile line names one step the command performed, so one load step and no emit step follow from a single load without printing; the LLM schema has no tuple form, so the tuple project must fail with the transform exit 3.
// @evidence contracts/testing.md#distinguishing-cases The valid project and the tuple project differ in one property; the second proves the transforms still run on the single Program, and the emitted-build lane is owned by the build_emit tests.
// @evidence contracts/testing.md#execution-ownership Go discovers this case in the core test module; both checks run in-process through RunWithOutput over t.TempDir projects, with t.Setenv restoring the profile variable.
func TestCheckLoadsTheProgramOnce(t *testing.T) {
	t.Setenv("TTSC_NESTIA_PROFILE", "1")
	for _, valid := range []bool{true, false} {
		project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: valid})
		_, errText, code := runCoreNative([]string{
			"check",
			"--cwd", project.Root,
			"--tsconfig", "tsconfig.json",
			"--plugins-json", project.PluginsJSON,
		})
		want := 0
		if !valid {
			want = 3
		}
		if code != want {
			t.Fatalf("check of valid=%v exited %d, want %d\n%s", valid, code, want, errText)
		}
		if loads := strings.Count(errText, "ttsc-nestia profile: load-"); loads != 1 {
			t.Fatalf("check of valid=%v ran %d load steps\n%s", valid, loads, errText)
		}
		if !strings.Contains(errText, "ttsc-nestia profile: analysis-transforms=") {
			t.Fatalf("check of valid=%v did not run the analysis transforms\n%s", valid, errText)
		}
		if strings.Contains(errText, "ttsc-nestia profile: emit-") {
			t.Fatalf("check of valid=%v emitted\n%s", valid, errText)
		}
		if !valid && !strings.Contains(errText, "LLM schema does not support tuple type.") {
			t.Fatalf("the tuple project's check lacks its LLM diagnostic\n%s", errText)
		}
	}
}
