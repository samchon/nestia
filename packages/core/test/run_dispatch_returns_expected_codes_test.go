package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestRunDispatchReturnsExpectedCodes verifies the top-level Run command
// dispatcher routes version, help, the empty-args usage path, and an unknown
// command to their documented exit codes.
//
// Run is the single process entry point ttsc invokes; its switch is the contract
// boundary between the CLI surface and the subcommands. version/help/no-args are
// success (0), an unrecognized command is a usage error (2). A regression that
// reordered or merged those cases would change the exit code ttsc keys on, so we
// pin each terminal branch with a direct in-process call.
//
//  1. Run "version" and "help" and the no-argument path; assert each exits 0.
//  2. Run an unknown command and assert it exits 2.
func TestRunDispatchReturnsExpectedCodes(t *testing.T) {
	if code := transform.Run([]string{"version"}); code != 0 {
		t.Fatalf("version should exit 0, got %d", code)
	}
	if code := transform.Run([]string{"help"}); code != 0 {
		t.Fatalf("help should exit 0, got %d", code)
	}
	if code := transform.Run([]string{"--help"}); code != 0 {
		t.Fatalf("--help should exit 0, got %d", code)
	}
	if code := transform.Run(nil); code != 0 {
		t.Fatalf("no-args usage should exit 0, got %d", code)
	}
	if code := transform.Run([]string{"frobnicate"}); code != 2 {
		t.Fatalf("unknown command should exit 2, got %d", code)
	}
}
