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
