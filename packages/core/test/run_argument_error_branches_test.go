package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestRunArgumentErrorBranches verifies the subcommand argument validators
// reject contradictory or malformed flags with the usage exit code 2 before any
// program is loaded.
//
// These guards sit at the top of runBuild / runTransform and short-circuit the
// expensive LoadProgram step: mutually exclusive --emit/--noEmit, an unknown
// --output kind, and unparseable --plugins-json. They never reach the AST, so
// the only observable is the exit code; a regression that fell through to
// LoadProgram would change the failure mode ttsc reports. Each branch is pinned
// with a direct in-process Run call.
//
//  1. build with both --emit and --noEmit -> exit 2.
//  2. transform with --output other than "ts" -> exit 2.
//  3. transform with malformed --plugins-json -> exit 2.
func TestRunArgumentErrorBranches(t *testing.T) {
	temp := t.TempDir()
	if code := transform.Run([]string{
		"build", "--cwd", temp, "--emit", "--noEmit",
		"--plugins-json", coreNativePlugins("validate", "assert"),
	}); code != 2 {
		t.Fatalf("--emit + --noEmit should exit 2, got %d", code)
	}
	if code := transform.Run([]string{
		"transform", "--cwd", temp, "--output", "js",
		"--plugins-json", coreNativePlugins("validate", "assert"),
	}); code != 2 {
		t.Fatalf("unknown --output should exit 2, got %d", code)
	}
	if code := transform.Run([]string{
		"transform", "--cwd", temp, "--plugins-json", "{not json",
	}); code != 2 {
		t.Fatalf("malformed --plugins-json should exit 2, got %d", code)
	}
}
