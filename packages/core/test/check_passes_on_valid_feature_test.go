package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestCheckPassesOnValidFeature verifies the check subcommand loads a valid
// feature program, runs tsgo type diagnostics with ForceNoEmit, and exits 0
// without writing any file.
//
// check is the analysis-only seam ttsc uses for `--noEmit` type verification; it
// shares plugin parsing and program loading with build/transform but skips the
// transform stage entirely. A regression that accidentally emitted, or that
// surfaced clean programs as failures, would break the no-emit contract. Running
// it against a known-good DTO pins the success branch end to end.
//
//  1. Run check against a clean body-feature DTO via an extending tsconfig.
//  2. Assert the exit code is 0.
func TestCheckPassesOnValidFeature(t *testing.T) {
	temp := t.TempDir()
	featureRoot := featureRootForCore(t, "body")
	tsconfig := writeExtendingTsconfig(t, temp, featureRoot, "", []string{
		featureSource(t, "body", "api/structures/IBbsArticle.ts"),
	})
	code := transform.Run([]string{
		"check",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 0 {
		t.Fatalf("check should pass on a valid feature, got exit %d", code)
	}
}
