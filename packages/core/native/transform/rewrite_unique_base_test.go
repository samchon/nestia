package transform

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

// Verifies the unique-basename fallback does not match a sibling output that
// lives inside the same `src/` tree as the registered source.
//
// Regression: the fallback used to match any output sharing a basename with
// a registered source, so `src/index.ts` silently absorbed rewrites destined
// for every `src/.../index.ts` neighbor produced by ttsc's virtual fs. The
// symptom was `could not locate typia.*(...)` on unrelated generated files.
//
//  1. Register one rewrite for `/repo/tests/foo/src/index.ts`.
//  2. Ask findSourceForOutput for a sibling output inside the same src tree.
//  3. Expect no match.
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
