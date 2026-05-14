package main

import "testing"

func TestNativeRewriteSetFindSourceByUniqueBase(t *testing.T) {
	set := newNativeRewriteSet()
	set.Add(nativeRewrite{
		FilePath: "/repo/tests/test-transform-options/src/validate.ts",
		Method:   "TypedBody",
	})

	got, ok := set.findSourceForOutput(
		"/repo/tests/test-transform-options/lib/validate-assert/validate.js",
	)
	if !ok {
		t.Fatal("expected unique basename fallback to match source")
	}
	if got != "/repo/tests/test-transform-options/src/validate.ts" {
		t.Fatalf("unexpected source match: %q", got)
	}
}
