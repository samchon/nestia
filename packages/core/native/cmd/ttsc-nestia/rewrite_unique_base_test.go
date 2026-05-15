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

// Regression: the unique-basename fallback used to match any output that
// shared a basename with a registered source, even when the output was a
// sibling file inside the same source tree. That made `src/index.ts`
// silently claim rewrites for every `src/.../index.ts` neighbor produced by
// ttsc's virtual filesystem and surfaced as "could not locate typia.*(...)"
// errors on unrelated generated SDK files.
func TestNativeRewriteSetFindSourceByUniqueBaseSkipsSourceTreeSiblings(t *testing.T) {
	set := newNativeRewriteSet()
	set.Add(nativeRewrite{
		FilePath: "/repo/tests/foo/src/index.ts",
		Method:   "schemas",
	})

	// Output sits inside the same src/ tree, not in lib/dist/bin/build — it
	// must not absorb the rewrite registered for src/index.ts.
	if got, ok := set.findSourceForOutput(
		"/cache/.ttsc/project/1/fs/posix/repo/tests/foo/src/api/functional/health/index.js",
	); ok {
		t.Fatalf("expected no match for source-tree sibling, got %q", got)
	}
}
