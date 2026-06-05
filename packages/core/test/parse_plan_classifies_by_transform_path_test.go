package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/plugin"
)

// TestParsePlanClassifiesByTransformPath verifies ParsePlan recognizes the
// nestia / typia transforms by their config.transform module path even when the
// plugin `name` field is absent, and tolerates a non-string transform value.
//
// classify and stringConfig are unexported, so the external module can only
// reach them through ParsePlan. The path-based branch matters because consumers
// installed from npm register ttsc plugins by transform module rather than the
// "@nestia/core" name; a regression there would silently treat an npm install as
// having no nestia transform. The non-string config value exercises stringConfig's
// type-assertion guard, which otherwise reads 0% — it must yield an empty
// transform rather than panic.
//
//  1. Parse a payload whose entries carry only config.transform paths.
//  2. Assert Core / SDK / Typia are all detected and UsesNestia is true.
//  3. Parse an entry whose config.transform is a number and assert no panic and
//     that the unnamed entry is classified as nothing.
func TestParsePlanClassifiesByTransformPath(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"config":{"transform":"typia/lib/transform"}},
		{"config":{"transform":"@nestia/core/lib/transform"}},
		{"config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.Core || !plan.SDK || !plan.Typia {
		t.Fatalf("path-based classification failed: core=%v sdk=%v typia=%v", plan.Core, plan.SDK, plan.Typia)
	}
	if !plan.UsesNestia() {
		t.Fatal("UsesNestia should be true when core/sdk detected")
	}

	mixed, err := plugin.ParsePlan(`[{"config":{"transform":123}}]`)
	if err != nil {
		t.Fatalf("non-string transform must not error: %v", err)
	}
	if mixed.Core || mixed.SDK || mixed.Typia {
		t.Fatalf("non-string transform should classify as nothing, got %+v", mixed)
	}
	if len(mixed.Entries) != 1 || mixed.Entries[0].Transform != "" {
		t.Fatalf("non-string transform should yield empty Transform, got %+v", mixed.Entries)
	}
}
