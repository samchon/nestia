package main

import "testing"

// Verifies emittedJavaScriptExtension maps source-file extensions to the
// matching JavaScript output extension that tsgo writes.
//
// The native rewrite scan asks for the post-emit name of every registered
// source. A mismatch here means the rewrite searches for `.js` files when
// the project actually emits `.mjs` (ESM packages) or `.cjs`, and the
// "could not locate <call>" failure path then fires on legitimate
// builds. The case-insensitive switch covers Windows-style mixed-case
// `.MTS` paths some toolchains produce.
//
//  1. Cover the three explicit branches (.mts, .cts, default).
//  2. Cover the case-insensitive variants (.MTS, .CTS).
//  3. Cover the default fallback for unknown / extensionless inputs.
func TestEmittedJavaScriptExtensionMapsSourceToOutput(t *testing.T) {
	cases := []struct {
		name   string
		source string
		want   string
	}{
		{"plain ts", "/repo/src/index.ts", ".js"},
		{"plain tsx", "/repo/src/Component.tsx", ".js"},
		{"esm mts", "/repo/src/index.mts", ".mjs"},
		{"cjs cts", "/repo/src/index.cts", ".cjs"},
		{"uppercase mts", "/repo/src/Index.MTS", ".mjs"},
		{"uppercase cts", "/repo/src/Index.CTS", ".cjs"},
		{"declaration only", "/repo/src/types.d.ts", ".js"},
		{"unknown extension", "/repo/src/data.json", ".js"},
		{"extensionless", "/repo/src/README", ".js"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := emittedJavaScriptExtension(tc.source); got != tc.want {
				t.Fatalf("emittedJavaScriptExtension(%q) = %q, want %q", tc.source, got, tc.want)
			}
		})
	}
}

// Verifies matchPattern strictly matches the literal-pattern branch and
// returns the wildcard capture for star-bearing patterns.
//
// `matchPattern` underpins every `paths` resolver entry — a regression in
// the prefix / suffix slice arithmetic would silently break tsconfig
// `paths` aliasing for any project that uses it. The literal branch must
// reject `pattern !== specifier`; the wildcard branch must demand BOTH
// the prefix and suffix to anchor before extracting the capture.
//
//  1. Literal patterns match only on byte equality.
//  2. Single-wildcard patterns extract the gap between prefix and suffix.
//  3. Mismatched prefix or suffix returns no capture.
func TestMatchPatternLiteralAndWildcardBranches(t *testing.T) {
	cases := []struct {
		name     string
		pattern  string
		input    string
		want     string
		matched  bool
	}{
		{"literal match", "@api", "@api", "", true},
		{"literal mismatch", "@api", "@api/lib", "", false},
		{"wildcard captures middle", "@api/*", "@api/users", "users", true},
		{"wildcard captures nested", "@api/lib/*", "@api/lib/sub/file", "sub/file", true},
		{"wildcard mismatch prefix", "@api/*", "@other/users", "", false},
		{"wildcard mismatch suffix", "@api/*.ts", "@api/users.tsx", "", false},
		{"wildcard between prefix and suffix", "src/*/index.ts", "src/foo/index.ts", "foo", true},
		{"empty capture allowed", "prefix*suffix", "prefixsuffix", "", true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := matchPattern(tc.pattern, tc.input)
			if ok != tc.matched {
				t.Fatalf("matchPattern(%q, %q) ok = %v, want %v", tc.pattern, tc.input, ok, tc.matched)
			}
			if ok && got != tc.want {
				t.Fatalf("matchPattern(%q, %q) capture = %q, want %q", tc.pattern, tc.input, got, tc.want)
			}
		})
	}
}

// Verifies patternRank assigns longer literal-character counts higher rank
// so the longest non-wildcard pattern wins when several match.
//
// tsconfig `paths` resolution sorts candidates by `patternRank` descending
// to break ties — without this ordering the resolver could pick the
// loosest pattern over a more specific one (e.g. `*` over `@api/*`).
//
//  1. A pure-wildcard pattern ranks 0.
//  2. Each non-wildcard character adds 1 regardless of position.
//  3. Multiple wildcards do not double-count literal segments.
func TestPatternRankCountsNonWildcardCharacters(t *testing.T) {
	cases := []struct {
		pattern string
		want    int
	}{
		{"*", 0},
		{"@api/*", 5},
		{"@api/lib/*", 9},
		{"src/*/index.ts", 13},
		{"prefix*suffix", 12},
	}
	for _, tc := range cases {
		if got := patternRank(tc.pattern); got != tc.want {
			t.Fatalf("patternRank(%q) = %d, want %d", tc.pattern, got, tc.want)
		}
	}
}

// Verifies normalizePath collapses redundant separators and translates
// platform path separators to POSIX form.
//
// The rewrite pipeline keys outputs and sources by their normalized
// POSIX-shaped path. A regression here would split a single logical
// source into multiple cache entries on Windows, defeating
// `nativeRewriteSet`'s deduplication.
//
//  1. Empty input returns empty.
//  2. Backslashes are translated and adjacent separators collapsed.
//  3. `..` segments are resolved.
func TestNormalizePathProducesPosixSlashes(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"", ""},
		{"/repo/src/index.ts", "/repo/src/index.ts"},
		{"/repo//src///index.ts", "/repo/src/index.ts"},
		{"/repo/src/../src/index.ts", "/repo/src/index.ts"},
		{"./relative/path", "relative/path"},
	}
	for _, tc := range cases {
		if got := normalizePath(tc.input); got != tc.want {
			t.Fatalf("normalizePath(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

// Verifies isOutsideRelativePath flags any relative path that escapes the
// root via `..` segments.
//
// `pathRewriter.outputForSource` refuses to map sources that resolve
// outside `rootDir`. Without this guard, a controller imported from a
// monorepo neighbor would emit into the outDir at a relative position
// that collides with an unrelated file.
//
//  1. Bare `..` is outside.
//  2. `../...` prefix is outside.
//  3. Same-or-nested paths are inside.
func TestIsOutsideRelativePathRejectsParentEscapes(t *testing.T) {
	cases := []struct {
		rel  string
		want bool
	}{
		{"..", true},
		{"../sibling", true},
		{"../../escape", true},
		{".", false},
		{"nested/file.ts", false},
		{"sub/../same.ts", false},
	}
	for _, tc := range cases {
		if got := isOutsideRelativePath(tc.rel); got != tc.want {
			t.Fatalf("isOutsideRelativePath(%q) = %v, want %v", tc.rel, got, tc.want)
		}
	}
}

// Verifies stripKnownSourceExtension prefers the longest known suffix and
// falls back to filepath.Ext for unknown extensions.
//
// The declaration-file extensions (`.d.ts`, `.d.mts`, `.d.cts`) must be
// matched as a whole — falling through to the simpler `.ts` strip would
// leave the `.d` suffix on the stem and silently produce wrong virtual
// paths for declaration emitters.
//
//  1. `.d.ts` strips the full three-character suffix.
//  2. Each one-extension form (`.ts`, `.tsx`, `.mts`, …) strips cleanly.
//  3. Unknown extensions fall back to filepath.Ext.
//  4. Case-insensitive match on uppercase variants.
func TestStripKnownSourceExtensionPrefersLongestMatch(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"types.d.ts", "types"},
		{"types.d.mts", "types"},
		{"types.d.cts", "types"},
		{"index.ts", "index"},
		{"index.tsx", "index"},
		{"index.mts", "index"},
		{"index.cts", "index"},
		{"index.js", "index"},
		{"data.json", "data"},
		{"Index.D.TS", "Index"},
		{"README", "README"},
	}
	for _, tc := range cases {
		if got := stripKnownSourceExtension(tc.input); got != tc.want {
			t.Fatalf("stripKnownSourceExtension(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

// Verifies replaceSourceExtension swaps the known TypeScript extension
// while preserving the rest of the path.
//
// Combined with `emittedJavaScriptExtension`, this drives the source ↔
// output filename mapping the rewrite scan depends on. Declaration-file
// suffixes must be stripped wholly so that `types.d.ts` becomes
// `types.js`, not `types.d.js`.
//
//  1. `.ts` is replaced with the chosen output extension.
//  2. Declaration suffixes are stripped before replacement.
//  3. POSIX separators in the input flow through unchanged.
func TestReplaceSourceExtensionSwapsKnownSuffix(t *testing.T) {
	cases := []struct {
		input string
		ext   string
		want  string
	}{
		{"src/index.ts", ".js", "src/index.js"},
		{"src/index.mts", ".mjs", "src/index.mjs"},
		{"src/types.d.ts", ".js", "src/types.js"},
		{"src/nested/foo.ts", ".js", "src/nested/foo.js"},
	}
	for _, tc := range cases {
		if got := replaceSourceExtension(tc.input, tc.ext); got != tc.want {
			t.Fatalf("replaceSourceExtension(%q, %q) = %q, want %q", tc.input, tc.ext, got, tc.want)
		}
	}
}
