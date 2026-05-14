package main

import "testing"

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
