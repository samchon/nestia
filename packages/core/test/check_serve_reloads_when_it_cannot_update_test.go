package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestCheckServeReloadsWhenItCannotUpdate verifies the resident check loads the
// project again exactly when the request names a change the resident Program
// cannot absorb, and keeps it otherwise.
//
// An incremental update needs an existing member and its readable content. A
// new path may enter the Program through its include pattern, an invalidation
// means ttsc no longer vouches for the previous state, and a member that cannot
// be read has no content to apply; each must load the project instead of
// guessing. A declared external input outside the Program, by contrast, does
// not touch it. A failed load must withhold the TypeScript acknowledgment and
// the file list, so ttsc runs its own recovery check, and a malformed request
// must be answered without disturbing the Program.
//
//  1. Answer a first request with one load of a project whose main source
//     imports a second member.
//  2. Send a declared external path: the Program is reused.
//  3. Send an unknown source path, then an invalidation: each loads again.
//  4. Delete the imported member and send it: the reload reports the missing
//     module as an acknowledged TypeScript failure.
//  5. Break the tsconfig and invalidate: the load fails with no file list and
//     no acknowledgment; then send a malformed line.
//  6. Restore both files and send an empty request: the project loads cleanly.
//
// @evidence contracts/testing.md#behavioral-verification The check-serve dispatcher runs eight scripted cycles through RunWithIO; each JSON reply's status, telemetry, file list and acknowledgment are asserted.
// @evidence contracts/testing.md#independent-expectations The ttsc resident check protocol fixes the reload triggers (unknown path, invalidate, unreadable change), the external-input exemption and the omitted acknowledgment on a load failure; TypeScript reports an import of a deleted module as TS2307, and an unparsable tsconfig cannot load, independently of nestia.
// @evidence contracts/testing.md#distinguishing-cases The declared external path is the reuse twin of the unknown path; invalidation, unreadable change, config failure, malformed framing and recovery are each one cycle, and edit reuse is owned by TestCheckServeAnswersEditsOnOneProgram.
// @evidence contracts/testing.md#execution-ownership Go discovers this case in the core test module; the session runs in-process through RunWithIO over a t.TempDir project, with no native binary or ttsc launcher.
func TestCheckServeReloadsWhenItCannotUpdate(t *testing.T) {
	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
	main := filepath.Join(project.Root, "src", "main.ts")
	extra := filepath.Join(project.Root, "src", "extra.ts")
	tsconfig := filepath.Join(project.Root, "tsconfig.json")
	source, err := os.ReadFile(main)
	if err != nil {
		t.Fatal(err)
	}
	config, err := os.ReadFile(tsconfig)
	if err != nil {
		t.Fatal(err)
	}
	extraSource := "export const extra: string = \"extra\";\n"
	writeFile(t, extra, extraSource)
	writeFile(t, main, "import { extra } from \"./extra\";\nvoid extra;\n"+string(source))
	notes := filepath.ToSlash(filepath.Join(project.Root, "notes.md"))
	other := filepath.ToSlash(filepath.Join(project.Root, "src", "other.ts"))
	args := []string{"--cwd", project.Root, "--tsconfig", "tsconfig.json", "--plugins-json", project.PluginsJSON}

	replies := runCheckServeSession(t, args, []checkServeStep{
		{Request: `{}`},
		{Before: func() { writeFile(t, notes, "notes") }, Request: `{"changed":["` + notes + `"],"external":["` + notes + `"]}`},
		{Before: func() { writeFile(t, other, "export const other = 1;\n") }, Request: `{"changed":["` + other + `"]}`},
		{Request: `{"invalidate":true}`},
		{Before: func() {
			if err := os.Remove(extra); err != nil {
				t.Fatal(err)
			}
		}, Request: `{"changed":["` + filepath.ToSlash(extra) + `"]}`},
		{Before: func() { writeFile(t, tsconfig, "{") }, Request: `{"invalidate":true}`},
		{Request: `not json`},
		{Before: func() {
			writeFile(t, tsconfig, string(config))
			writeFile(t, extra, extraSource)
		}, Request: `{}`},
	})

	type expected struct {
		status, loads    int
		reused, reported bool
	}
	want := []expected{
		{status: 0, loads: 1, reported: true},
		{status: 0, loads: 1, reused: true, reported: true},
		{status: 0, loads: 2, reported: true},
		{status: 0, loads: 3, reported: true},
		{status: 2, loads: 4, reported: true},
		{status: 2, loads: 4},
		{status: 2, loads: 4},
		{status: 0, loads: 5, reported: true},
	}
	for index, reply := range replies {
		if reply.Status != want[index].status {
			t.Fatalf("reply %d status %d, want %d\nstderr=%s", index, reply.Status, want[index].status, reply.Stderr)
		}
		mustReplyTelemetry(t, index, reply, want[index].loads, 0, want[index].reused)
		reported := reply.TypeScriptDiagnosticsReported != nil && *reply.TypeScriptDiagnosticsReported
		if reported != want[index].reported {
			t.Fatalf("reply %d acknowledgment %v, want %v\nstderr=%s", index, reported, want[index].reported, reply.Stderr)
		}
		if want[index].reported {
			mustListProgram(t, index, reply, main)
		} else if len(reply.ProgramFiles) != 0 {
			t.Fatalf("reply %d lists files of a Program it did not report: %v", index, reply.ProgramFiles)
		}
	}
	mustListProgram(t, 0, replies[0], extra)
	if !strings.Contains(replies[4].Stderr, "TS2307") {
		t.Fatalf("the reload after deleting a member does not report the missing module\n%s", replies[4].Stderr)
	}
	if !strings.Contains(replies[6].Stderr, "invalid request") {
		t.Fatalf("the malformed request reply does not name the framing failure\n%s", replies[6].Stderr)
	}
}
