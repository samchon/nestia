package main

import "testing"

// Verifies outputMatchesSourceStem accepts virtual-fs same-stem mirrors and
// rejects single-segment suffix collisions across the source tree.
//
// Regression: a top-level `src/index.ts` produced a one-segment relative
// ("index") that the HasSuffix fallback matched against every output ending
// in `/index.js`. The native rewrite scan then trawled unrelated files for
// typia call sites that only existed in the root entry, raising
// "could not locate typia.reflect.schemas(...) call".
//
//  1. Mirror a src/index virtual fs — must match.
//  2. Compare top-level src/index against nested src/api/health/index — must reject.
//  3. Cover the package src->lib mapping and an unrelated stem pair.
func TestOutputMatchesSourceStem(t *testing.T) {
	cases := []struct {
		name   string
		output string
		source string
		want   bool
	}{
		{
			name:   "virtual fs mirrors src tree",
			output: "/cache/.ttsc/project/1/fs/posix/repo/tests/foo/src/index",
			source: "/repo/tests/foo/src/index",
			want:   true,
		},
		{
			name:   "top-level src/index does not match nested src/api/health/index",
			output: "/cache/.ttsc/project/1/fs/posix/repo/tests/foo/src/api/functional/health/index",
			source: "/repo/tests/foo/src/index",
			want:   false,
		},
		{
			name:   "src/api source matches nested api output",
			output: "/cache/.ttsc/project/1/fs/posix/repo/tests/foo/src/api/functional/health/index",
			source: "/repo/tests/foo/src/api/functional/health/index",
			want:   true,
		},
		{
			name:   "package src maps to lib output",
			output: "/repo/packages/core/lib/decorators/TypedBody",
			source: "/repo/packages/core/src/decorators/TypedBody",
			want:   true,
		},
		{
			name:   "unrelated stems",
			output: "/repo/packages/core/lib/decorators/TypedBody",
			source: "/repo/packages/sdk/src/generates/Foo",
			want:   false,
		},
		{
			name:   "top-level src/index does not match nested src/api/index",
			output: "/cache/.ttsc/project/1/fs/posix/repo/tests/foo/src/api/index",
			source: "/repo/tests/foo/src/index",
			want:   false,
		},
	}
	for _, tc := range cases {
		got := outputMatchesSourceStem(tc.output, tc.source)
		if got != tc.want {
			t.Errorf("%s: outputMatchesSourceStem(%q, %q) = %v, want %v",
				tc.name, tc.output, tc.source, got, tc.want)
		}
	}
}

func TestCountNativeArgumentsBasic(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want int
	}{
		{"empty", "", 0},
		{"single", "x", 1},
		{"two simple", "a, b", 2},
		{"three with object", "a, { b: 1, c: 2 }, d", 3},
		{"comma in string", `"a, b", c`, 2},
		{"comma in single quote", `'a, b', c, d`, 3},
		{"escaped quote", `"a\"b", c`, 2},
		{"comma in template", "`a,b`, c", 2},
		{"nested call", "foo(a, b), c", 2},
		{"nested array", "[1, 2, 3], y", 2},
	}
	for _, tc := range cases {
		got := countNativeArguments(tc.in)
		if got != tc.want {
			t.Errorf("%s: countNativeArguments(%q) = %d, want %d", tc.name, tc.in, got, tc.want)
		}
	}
}

// Regression: template-literal `${...}` substitutions contain real expressions
// — any '(' / ')' / ',' inside a substitution must be treated as expression
// tokens, not template-string content. Prior implementation skipped the entire
// backtick range as if it were a flat string and miscounted arguments when a
// substitution contained quote-shaped characters or nested templates.
func TestCountNativeArgumentsTemplateSubstitution(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want int
	}{
		{"quote-inside-substitution", "`x${\")\"}y`, foo", 2},
		{"comma-inside-substitution-grouped", "`x${(1, 2)}y`, foo", 2},
		{"nested-template", "`a${`b${1}c`}d`, foo", 2},
		{"substitution-with-object", "`x${{ a: 1, b: 2 }}y`, foo", 2},
		{"call-inside-substitution", "`x${ f(1, 2) }y`, foo", 2},
	}
	for _, tc := range cases {
		got := countNativeArguments(tc.in)
		if got != tc.want {
			t.Errorf("%s: countNativeArguments(%q) = %d, want %d", tc.name, tc.in, got, tc.want)
		}
	}
}
