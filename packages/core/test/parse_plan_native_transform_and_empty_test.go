package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/plugin"
)

// TestParsePlanNativeTransformAndEmpty verifies ParsePlan handles the empty
// payload, an entry whose config object is absent, and classification through
// the native `.cjs` transform module constants the ttsc wrapper publishes.
//
// Three otherwise-unreached branches converge here. The empty-payload guard
// returns a zero Plan before any JSON parsing; stringConfig's nil-config arm
// fires when an entry carries no `config` object at all (it must yield an empty
// transform, not panic); and classify recognizes @nestia/core / @nestia/sdk
// through CoreNativeTransform / SDKNativeTransform, the module specifiers a real
// ttsc install registers instead of the bare package name. A regression in any
// of these would make an npm-installed consumer look like it has no nestia
// transform, or crash on a config-less plugin entry.
//
//  1. ParsePlan("") and assert a zero Plan with no entries and no error.
//  2. ParsePlan an entry with no `config` key and assert no panic / empty transform.
//  3. ParsePlan entries naming the native `.cjs` transforms and assert Core/SDK.
func TestParsePlanNativeTransformAndEmpty(t *testing.T) {
	empty, err := plugin.ParsePlan("")
	if err != nil {
		t.Fatalf("empty payload must not error: %v", err)
	}
	if empty.Core || empty.SDK || empty.Typia || len(empty.Entries) != 0 || empty.UsesNestia() {
		t.Fatalf("empty payload must yield a zero plan, got %+v", empty)
	}

	noConfig, err := plugin.ParsePlan(`[{"name":"some-plugin","stage":"before"}]`)
	if err != nil {
		t.Fatalf("config-less entry must not error: %v", err)
	}
	if len(noConfig.Entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(noConfig.Entries))
	}
	if noConfig.Entries[0].Transform != "" {
		t.Fatalf("config-less entry must have empty transform, got %q", noConfig.Entries[0].Transform)
	}
	if noConfig.Entries[0].Stage != "before" {
		t.Fatalf("stage should be preserved, got %q", noConfig.Entries[0].Stage)
	}

	native, err := plugin.ParsePlan(`[
		{"config":{"transform":"` + plugin.CoreNativeTransform + `"}},
		{"config":{"transform":"` + plugin.SDKNativeTransform + `"}}
	]`)
	if err != nil {
		t.Fatalf("native transform payload must not error: %v", err)
	}
	if !native.Core || !native.SDK {
		t.Fatalf("native .cjs transforms should classify as core+sdk, got %+v", native)
	}
	if !native.UsesNestia() {
		t.Fatal("UsesNestia should be true when native core/sdk transforms are present")
	}
}
