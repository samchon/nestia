package test

import (
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"

	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
)

// Verifies EmitTransform returns a nil transform (and no diagnostics) when the
// program carries no controller method sites.
//
// EmitTransform's zero-site early return (register.go:99-101) is the branch a
// project with no decorated controllers takes — none of the metadata-asserting
// tests reach it because they all load a controller. Loading a program that
// contains only a structure file with no @TypedRoute method drives that branch
// in-process with no disk emit.
//
//  1. Load a program over a single structure file (no controller).
//  2. Call EmitTransform.
//  3. Assert it returns a nil transform and no diagnostics.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform on an article-structure-only program must return a nil transform and no diagnostics.
// @evidence contracts/testing.md#independent-expectations A DTO without decorated controller methods supplies no operation sites, so analysis must have no rewrite rather than injecting unused metadata.
// @evidence contracts/testing.md#distinguishing-cases This is the no-site negative, complementary to controller metadata positives and the linked-plugin no-site case; successful program load is checked first.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKEmitTransformReturnsNilWithoutSites(t *testing.T) {
	root := repoRoot(t)
	temp := writeFeatureTsconfig(t, root, "body", []string{
		"api/structures/IBbsArticle.ts",
	})
	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load program: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected load diagnostics: %v", diags)
	}
	defer prog.Close()

	transform, tdiags := nativesdk.EmitTransform(prog)
	if len(tdiags) > 0 {
		t.Fatalf("expected no diagnostics, got %v", tdiags)
	}
	if transform != nil {
		t.Fatal("expected a nil transform when the program has no controller sites")
	}
}
