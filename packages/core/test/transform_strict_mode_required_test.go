package test

import (
	"strings"
	"testing"
)

// TestTransformStrictModeRequired verifies the transform reports "strict mode
// is required." for a project without strictNullChecks, however the options
// spell it, and stays silent for a strict project.
//
// test-sdk's non-strict features could never reach this diagnostic: the
// workspace resolves nestia's packages to their TypeScript sources, which the
// feature's loose configuration fails to type-check first, so they passed on
// that unrelated failure (#1694). The transform is driven here directly.
//
//  1. Transform one controller under `strict: false`, `strictNullChecks:
//     false`, and `strict: true` with `strictNullChecks: false`.
//  2. Assert each exits 3 naming the requirement, and a strict project exits 0.
func TestTransformStrictModeRequired(t *testing.T) {
	const feature = "plain-text-parser"
	cases := []struct {
		name    string
		options string
		fail    bool
	}{
		{name: "non-strict", options: `, "strict": false`, fail: true},
		{name: "non-strictNullChecks", options: `, "strictNullChecks": false`, fail: true},
		{name: "strict-but-not-strictNullChecks", options: `, "strict": true, "strictNullChecks": false`, fail: true},
		{name: "strict", options: `, "strict": true`, fail: false},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			temp := t.TempDir()
			controller := featureSource(t, feature, "controllers/TextParserController.ts")
			tsconfig := writeExtendingTsconfig(t, temp, featureRootForCore(t, feature), tc.options, []string{controller})
			_, errText, code := runCoreNative([]string{
				"transform",
				"--cwd", temp,
				"--tsconfig", tsconfig,
				"--file", controller,
				"--plugins-json", coreNativePlugins("validate", "assert"),
			})
			reported := strings.Contains(errText, "strict mode is required.")
			if tc.fail {
				if code != 3 || reported == false {
					t.Fatalf("expected exit 3 naming strict mode, got %d\n%s", code, errText)
				}
			} else if code != 0 || reported {
				t.Fatalf("a strict project should transform cleanly, got %d\n%s", code, errText)
			}
		})
	}
}
