package main

import "testing"

// Verifies commonJSImportAliasBase produces a valid JS identifier base
// for every module specifier the CommonJS substitution table feeds it.
//
// Output forms the `<base>_N.default` substitution map that the native
// rewrite scan looks up against tsgo's CJS emit. Any input that produces
// a non-identifier base (leading digit, contains `-`, empty after
// extension strip) would generate a substitution that never matches
// tsgo's emit and silently break the rewrite for that import. The
// reverted P-8 sat on top of this helper — locking the branches now
// guards the rewrite contract against future emit-side changes.
//
//  1. Letters / digits / `_` / `$` survive verbatim.
//  2. Non-identifier characters (dashes, dots, slashes) become `_`.
//  3. Empty or pathological bases (`.`, `/`) fall back to `mod`.
//  4. Leading digits are prefixed with `_` so the base is identifier-safe.
//  5. Unicode letters survive (Go's `unicode.IsLetter`).
//  6. File extensions are stripped before sanitization.
func TestCommonJSImportAliasBaseProducesIdentifierSafeName(t *testing.T) {
	cases := []struct {
		name   string
		module string
		want   string
	}{
		{"plain package", "typia", "typia"},
		{"scoped package", "@nestia/core", "core"},
		{"dotted package", "lodash.merge", "lodash"},
		{"path with slashes", "@nestia/core/lib/transform", "transform"},
		{"dashes become underscores", "kebab-case-lib", "kebab_case_lib"},
		{"trailing extension stripped", "module.mjs", "module"},
		{"empty becomes mod", "", "mod"},
		{"dot becomes mod", ".", "mod"},
		{"leading digit prefixed with underscore", "1abc", "_1abc"},
		{"underscore start preserved", "_internal", "_internal"},
		{"dollar start preserved", "$jq", "$jq"},
		{"unicode letter preserved", "한글", "한글"},
		{"mixed special chars sanitized", "foo.bar-baz", "foo"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := commonJSImportAliasBase(tc.module); got != tc.want {
				t.Fatalf("commonJSImportAliasBase(%q) = %q, want %q", tc.module, got, tc.want)
			}
		})
	}
}
