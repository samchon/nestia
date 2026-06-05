package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestExportsApplySourceRewrites verifies the exported ApplySourceRewrites /
// NewSourceRewrite seam — the only way another Go module (the @nestia/sdk
// plugin) can splice spans into a source file — applies non-overlapping
// rewrites right-to-left and rejects overlapping or out-of-range spans.
//
// SourceRewrite keeps its span fields unexported, so NewSourceRewrite is the
// sole constructor; a regression in the overlap guard or the descending-start
// application order would corrupt every contributor splice without a
// compile-time signal. Driving the exported pair directly pins both the happy
// path and the two error branches.
//
//  1. Apply two disjoint rewrites and assert both land at the right offsets.
//  2. Apply two overlapping rewrites and assert an error is returned.
//  3. Apply a rewrite whose end exceeds the source length and assert it errors.
func TestExportsApplySourceRewrites(t *testing.T) {
	source := "0123456789"
	out, err := transform.ApplySourceRewrites(source, []transform.SourceRewrite{
		transform.NewSourceRewrite(0, 2, "AB"),
		transform.NewSourceRewrite(8, 10, "YZ"),
	})
	if err != nil {
		t.Fatalf("disjoint rewrites should apply cleanly: %v", err)
	}
	if out != "AB234567YZ" {
		t.Fatalf("unexpected rewrite result %q", out)
	}

	if _, err := transform.ApplySourceRewrites(source, []transform.SourceRewrite{
		transform.NewSourceRewrite(0, 5, "X"),
		transform.NewSourceRewrite(3, 7, "Y"),
	}); err == nil {
		t.Fatal("overlapping rewrites must return an error")
	}

	if _, err := transform.ApplySourceRewrites(source, []transform.SourceRewrite{
		transform.NewSourceRewrite(5, 99, "X"),
	}); err == nil {
		t.Fatal("out-of-range rewrite must return an error")
	}
}
