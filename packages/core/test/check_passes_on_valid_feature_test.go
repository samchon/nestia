package test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestCheckPassesOnValidFeature verifies the check subcommand loads a valid
// feature program, runs tsgo type diagnostics with ForceNoEmit, and exits 0
// without writing any file.
//
// check is the analysis-only seam ttsc uses for `--noEmit` verification. It
// shares the complete transform traversal with build while discarding every
// generated artifact. A regression that accidentally emitted, or that surfaced
// clean programs as failures, would break the no-emit contract. Running it
// against a known-good DTO pins the success branch end to end.
//
//  1. Run check against a clean body-feature DTO via an extending tsconfig.
//  2. Assert the exit code is 0.
//
// @evidence contracts/testing.md#behavioral-verification The check dispatcher accepts a well-typed article DTO with exit zero and leaves its explicitly requested output directory and manifest absent.
// @evidence contracts/testing.md#independent-expectations The fixture declares a valid TypeScript DTO; analysis-only check must accept it and cannot publish output even when output locations are supplied.
// @evidence contracts/testing.md#distinguishing-cases This is the successful no-emit control against TestCheckReportsTypeError; LLM-specific no-emit diagnostics are owned by their separate table.
// @evidence contracts/testing.md#execution-ownership Go discovers the core Test function; it invokes transform.Run directly with an extending temporary configuration and tests observable artifact absence, without a compiler subprocess.
func TestCheckPassesOnValidFeature(t *testing.T) {
	temp := t.TempDir()
	featureRoot := featureRootForCore(t, "body")
	tsconfig := writeExtendingTsconfig(t, temp, featureRoot, "", []string{
		featureSource(t, "body", "api/structures/IBbsArticle.ts"),
	})
	outDir := filepath.Join(temp, "output")
	manifest := filepath.Join(temp, "manifest.json")
	code := transform.Run([]string{
		"check",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--outDir", outDir,
		"--manifest", manifest,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 0 {
		t.Fatalf("check should pass on a valid feature, got exit %d", code)
	}
	for _, output := range []string{outDir, manifest} {
		if _, err := os.Stat(output); !os.IsNotExist(err) {
			t.Fatalf("check published %s: %v", output, err)
		}
	}
}
