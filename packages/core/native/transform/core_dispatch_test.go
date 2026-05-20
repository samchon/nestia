package transform

import "testing"

// Verifies nestiaCoreParameterKind maps every supported decorator suffix
// to the programmer kind that drives validator generation.
//
// The suffix table is the single source of truth for parameter-decorator
// dispatch — a silent typo or a missing entry would silently route the
// affected decorator to the no-op path and emit no validator. The
// `WebSocketRoute.Header`-as-`TypedBody` and `EncryptedBody`-as-`TypedBody`
// rows are non-obvious: WebSocket header and encrypted body re-use the
// TypedBody programmer because their on-the-wire payload shape matches.
//
//  1. Every documented suffix returns the matching kind.
//  2. Multi-segment suffixes (`TypedQuery.Body`, `WebSocketRoute.Param`)
//     resolve only when both tail segments line up.
//  3. Unknown suffixes return the empty string (the no-op signal).
func TestNestiaCoreParameterKindDispatch(t *testing.T) {
	cases := []struct {
		name     string
		segments []string
		want     string
	}{
		{"bare TypedBody", []string{"TypedBody"}, "TypedBody"},
		{"imported core.TypedBody", []string{"core", "TypedBody"}, "TypedBody"},
		{"EncryptedBody maps to TypedBody", []string{"EncryptedBody"}, "TypedBody"},
		{"TypedHeaders", []string{"TypedHeaders"}, "TypedHeaders"},
		{"TypedParam", []string{"TypedParam"}, "TypedParam"},
		{"TypedQuery solo", []string{"TypedQuery"}, "TypedQuery"},
		{"PlainBody", []string{"PlainBody"}, "PlainBody"},
		{"TypedQuery.Body", []string{"TypedQuery", "Body"}, "TypedQueryBody"},
		{"TypedFormData.Body", []string{"TypedFormData", "Body"}, "TypedFormDataBody"},
		{"WebSocketRoute.Header maps to TypedBody", []string{"WebSocketRoute", "Header"}, "TypedBody"},
		{"WebSocketRoute.Param maps to TypedParam", []string{"WebSocketRoute", "Param"}, "TypedParam"},
		{"WebSocketRoute.Query maps to TypedQuery", []string{"WebSocketRoute", "Query"}, "TypedQuery"},
		{"unknown decorator", []string{"TypedSomethingElse"}, ""},
		{"empty segments", []string{}, ""},
		{"TypedQuery.Other is not TypedQueryBody", []string{"TypedQuery", "Other"}, ""},
		{"WebSocketRoute alone is not a parameter", []string{"WebSocketRoute"}, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := nestiaCoreParameterKind(tc.segments); got != tc.want {
				t.Fatalf("nestiaCoreParameterKind(%v) = %q, want %q", tc.segments, got, tc.want)
			}
		})
	}
}

// Verifies nestiaCoreMethodKind dispatches HTTP-method decorators to the
// correct route programmer kind.
//
// The two-position lookup (`[..., ROOT, VERB]`) keeps `EncryptedRoute.Post`
// distinct from `TypedQuery.Body` — both have two tail segments but only
// the former is a route. The verb whitelist (Get/Post/Patch/Put/Delete)
// pins the contract: any new HTTP verb would have to be added explicitly,
// preventing accidental dispatch on a typo like `Posts`.
//
//  1. Each HTTP verb under `TypedRoute` or `EncryptedRoute` returns `TypedRoute`.
//  2. Each HTTP verb under `TypedQuery` returns `TypedQueryRoute`.
//  3. Unknown roots or unknown verbs return the empty string.
//  4. Single-segment or empty segment lists return the empty string.
func TestNestiaCoreMethodKindDispatch(t *testing.T) {
	cases := []struct {
		name     string
		segments []string
		want     string
	}{
		{"TypedRoute.Get", []string{"TypedRoute", "Get"}, "TypedRoute"},
		{"TypedRoute.Post", []string{"TypedRoute", "Post"}, "TypedRoute"},
		{"TypedRoute.Patch", []string{"TypedRoute", "Patch"}, "TypedRoute"},
		{"TypedRoute.Put", []string{"TypedRoute", "Put"}, "TypedRoute"},
		{"TypedRoute.Delete", []string{"TypedRoute", "Delete"}, "TypedRoute"},
		{"EncryptedRoute.Post", []string{"EncryptedRoute", "Post"}, "TypedRoute"},
		{"TypedQuery.Get", []string{"TypedQuery", "Get"}, "TypedQueryRoute"},
		{"imported core.TypedRoute.Get", []string{"core", "TypedRoute", "Get"}, "TypedRoute"},
		{"unknown verb", []string{"TypedRoute", "Head"}, ""},
		{"unknown root", []string{"SomethingElse", "Get"}, ""},
		{"single segment", []string{"Get"}, ""},
		{"empty segments", []string{}, ""},
		{"verb-only suffix", []string{"TypedQuery", "Body"}, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := nestiaCoreMethodKind(tc.segments); got != tc.want {
				t.Fatalf("nestiaCoreMethodKind(%v) = %q, want %q", tc.segments, got, tc.want)
			}
		})
	}
}

// Verifies nestiaCoreSegmentsHaveSuffix matches the suffix slice against
// the trailing positions of the segment slice.
//
// The helper underpins every decorator-dispatch lookup. Off-by-one or
// length-clamping bugs would silently mismatch `core.TypedQuery.Body`
// against the suffix `["TypedQuery"]` — a regression flagged by the
// existing decorator routing tests, but cheap to anchor at the helper
// level too.
//
//  1. Exact length match returns true.
//  2. Shorter segments than the suffix never match.
//  3. Suffix tail of a longer segment list matches; prefix tail does not.
func TestNestiaCoreSegmentsHaveSuffix(t *testing.T) {
	cases := []struct {
		name     string
		segments []string
		suffix   []string
		want     bool
	}{
		{"exact match", []string{"TypedBody"}, []string{"TypedBody"}, true},
		{"suffix of longer", []string{"core", "TypedBody"}, []string{"TypedBody"}, true},
		{"two-segment suffix", []string{"core", "TypedQuery", "Body"}, []string{"TypedQuery", "Body"}, true},
		{"suffix longer than segments", []string{"TypedBody"}, []string{"core", "TypedBody"}, false},
		{"mismatched tail", []string{"core", "TypedBody"}, []string{"TypedRoute"}, false},
		{"empty suffix", []string{"core", "TypedBody"}, []string{}, true},
		{"both empty", []string{}, []string{}, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := nestiaCoreSegmentsHaveSuffix(tc.segments, tc.suffix); got != tc.want {
				t.Fatalf("nestiaCoreSegmentsHaveSuffix(%v, %v) = %v, want %v", tc.segments, tc.suffix, got, tc.want)
			}
		})
	}
}
