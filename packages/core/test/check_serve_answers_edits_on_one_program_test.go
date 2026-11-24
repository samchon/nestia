package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestCheckServeAnswersEditsOnOneProgram verifies the resident check keeps one
// Program across saves and still answers each one as a cold check would.
//
// `ttsc --noEmit --watch` starts the host's check as check-serve and sends one
// request per save. typia's and core's transforms leave the parsed sources
// intact, so the host applies each saved member to the resident Program instead
// of loading the project again; a host that reloaded would still answer
// correctly, so only the telemetry distinguishes residency. Correctness is
// checked against a cold check of the same file state, which owns the expected
// status, stdout and stderr: a TypeScript error, a typia LLM schema rejection
// raised inside the core transform, and the recovery to a clean project.
//
//  1. Start check-serve on a valid TypedRoute project and answer the first
//     request with one load.
//  2. Save a type error, then a tuple the LLM schema rejects, then the valid
//     source again, sending the saved path each time; then change a declared
//     external input outside the Program.
//  3. Require one load and one more update per save and none for the external
//     input, the Program's files with a bundled default library, and the
//     TypeScript acknowledgment on every reply.
//  4. Rewrite each state and require the cold check's status, stdout and
//     stderr to equal the resident reply.
//
// @evidence contracts/testing.md#behavioral-verification The check-serve dispatcher runs four scripted cycles through RunWithIO; each JSON reply's status, streams, telemetry and file list are asserted, and every reply is compared with the check subcommand on the same file state.
// @evidence contracts/testing.md#independent-expectations TypeScript assignability rejects a number for a string property, the LLM schema has no tuple form, and the ttsc protocol defines programLoads, programUpdates, reused, programFiles and the acknowledgment; the cold check is the separately executed reference for each answer.
// @evidence contracts/testing.md#distinguishing-cases A clean state, a TypeScript failure (status 2), a transform failure (status 3), recovery and an external-only cycle that applies no update are distinct answers over one Program; reload triggers are owned by TestCheckServeReloadsWhenItCannotUpdate and contributor mutation by TestCheckServeReloadsAfterAContributorTransform.
// @evidence contracts/testing.md#execution-ownership Go discovers this case in the core test module; the session and the cold checks run in-process through RunWithIO and RunWithOutput over a t.TempDir project, with no native binary or ttsc launcher.
func TestCheckServeAnswersEditsOnOneProgram(t *testing.T) {
	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
	main := filepath.Join(project.Root, "src", "main.ts")
	original, err := os.ReadFile(main)
	if err != nil {
		t.Fatal(err)
	}
	valid := string(original)
	typeError := strings.Replace(valid, `{ value: "ok" }`, `{ value: 1 }`, 1)
	tuple := strings.Replace(strings.Replace(valid, `value: string;`, `pair: [string, number];`, 1), `{ value: "ok" }`, `{ pair: ["one", 1] }`, 1)
	if typeError == valid || tuple == valid {
		t.Fatal("fixture source no longer holds the edited text")
	}
	states := []string{valid, typeError, tuple, valid, valid}
	save := func(source string) func() {
		return func() { writeFile(t, main, source) }
	}
	request := `{"changed":["` + filepath.ToSlash(main) + `"]}`
	// A declared external input outside the Program changes nothing the
	// Program was built from, so its cycle applies no update.
	external := filepath.ToSlash(filepath.Join(project.Root, "swagger.json"))
	externalOnly := `{"changed":["` + external + `"],"external":["` + external + `"]}`
	args := []string{"--cwd", project.Root, "--tsconfig", "tsconfig.json", "--plugins-json", project.PluginsJSON}

	replies := runCheckServeSession(t, args, []checkServeStep{
		{Request: `{}`},
		{Before: save(typeError), Request: request},
		{Before: save(tuple), Request: request},
		{Before: save(valid), Request: request},
		{Before: func() { writeFile(t, external, `{"openapi":"3.1.0"}`) }, Request: externalOnly},
	})
	wantStatus := []int{0, 2, 3, 0, 0}
	wantUpdates := []int{0, 1, 2, 3, 3}
	for index, reply := range replies {
		if reply.Status != wantStatus[index] {
			t.Fatalf("reply %d status %d, want %d\nstderr=%s", index, reply.Status, wantStatus[index], reply.Stderr)
		}
		mustReplyTelemetry(t, index, reply, 1, wantUpdates[index], index != 0)
		mustListProgram(t, index, reply, main)
		if reply.TypeScriptDiagnosticsReported == nil || !*reply.TypeScriptDiagnosticsReported {
			t.Fatalf("reply %d does not acknowledge its TypeScript diagnostics", index)
		}
	}
	if !strings.Contains(replies[1].Stderr, "TS2322") {
		t.Fatalf("the type error reply lacks TS2322\n%s", replies[1].Stderr)
	}
	if !strings.Contains(filepath.ToSlash(replies[2].Stderr), "src/main.ts:8:4 - error TS(nestia.core.TypedRoute)") ||
		!strings.Contains(replies[2].Stderr, "LLM schema does not support tuple type.") ||
		strings.Contains(replies[2].Stderr, "TS2322") {
		t.Fatalf("the tuple reply lacks its transform diagnostic\n%s", replies[2].Stderr)
	}

	for index, source := range states {
		writeFile(t, main, source)
		out, errText, code := runCoreNative(append([]string{"check"}, args...))
		reply := replies[index]
		if code != reply.Status || out != reply.Stdout || errText != reply.Stderr {
			t.Fatalf("reply %d differs from a cold check\nresident status=%d stdout=%q stderr=%q\ncold status=%d stdout=%q stderr=%q",
				index, reply.Status, reply.Stdout, reply.Stderr, code, out, errText)
		}
	}
}
