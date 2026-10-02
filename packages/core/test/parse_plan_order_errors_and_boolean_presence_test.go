package test

import (
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/plugin"
)

// TestParsePlanOrderErrorsAndBooleanPresence verifies ordered plugin parsing and
// boolean presence without loading a compiler program.
//
// Explicit false must survive parsing: option inheritance cannot treat it as
// omission. Malformed input must fail locally without contaminating later calls.
//
//  1. Reject malformed payloads and accept empty protocol forms.
//  2. Parse ordered stages, exact identities and authored option values.
//  3. Require literal family and boolean-presence expectations after failures.
//
// @evidence contracts/testing.md#behavioral-verification ParsePlan rejects wrong JSON shapes, preserves entry order and stages, and exposes true/false presence through BoolConfig; a subsequent valid parse must work after every malformed input.
// @evidence contracts/testing.md#independent-expectations The ordered JSON array and explicit boolean literals establish the expected results; near package/path spellings are not published descriptor identities.
// @evidence contracts/testing.md#distinguishing-cases Empty whitespace and empty list; malformed syntax, null/object/scalar payloads and invalid entry/config types; default/explicit stages; true, false, missing, null, string and numeric option values; exact versus near identities all have independent assertions.
// @evidence contracts/testing.md#execution-ownership Go discovers this matching core unit function. It calls ParsePlan, Kind and BoolConfig directly on authored strings and maps without installing dependencies, building artifacts or starting children.
func TestParsePlanOrderErrorsAndBooleanPresence(t *testing.T) {
	for _, payload := range []string{"", " \r\n\t", "[]"} {
		plan, err := plugin.ParsePlan(payload)
		if err != nil || len(plan.Entries) != 0 || plan.Core || plan.SDK || plan.Typia || plan.UsesNestia() {
			t.Errorf("empty %q: plan=%+v error=%v", payload, plan, err)
		}
	}
	for _, payload := range []string{"[", "null", "{}", "true", "1", `[null]`, `[{},null]`, `[{"name":"@nestia/core"},{"name":"typia"},null]`, `[{"config":[]}]`, `[{"name":3}]`, `[1]`} {
		t.Run(payload, func(t *testing.T) {
			plan, err := plugin.ParsePlan(payload)
			if err == nil || !strings.Contains(err.Error(), "plugins-json") || len(plan.Entries) != 0 || plan.UsesNestia() || plan.Typia {
				t.Fatalf("malformed payload returned plan=%+v error=%v", plan, err)
			}
			recovery, err := plugin.ParsePlan(`[{"name":"@nestia/core"}]`)
			if err != nil || !recovery.Core || len(recovery.Entries) != 1 {
				t.Fatalf("parse after rejection: %+v %v", recovery, err)
			}
		})
	}
	plan, err := plugin.ParsePlan(`[
		{"name":"foreign","stage":"before","config":{"numeric":false}},
		{"name":" @nestia/core ","config":{"numeric":true}},
		{"config":{"transform":" @nestia/sdk/native/transform.cjs "}},
		{"name":"typia","stage":"after"},
		{"name":"@nestia/core-extra","config":{"transform":"@nestia/core/lib/transform-extra"}}
	]`)
	if err != nil || len(plan.Entries) != 5 || !plan.Core || !plan.SDK || !plan.Typia {
		t.Fatalf("ordered plan: %+v %v", plan, err)
	}
	for index, want := range []struct{ kind, stage string }{{"", "before"}, {"core", "transform"}, {"sdk", "transform"}, {"typia", "after"}, {"", "transform"}} {
		entry := plan.Entries[index]
		if entry.Kind() != want.kind || entry.Stage != want.stage {
			t.Errorf("entry %d = %+v, want %+v", index, entry, want)
		}
	}
	for _, item := range []struct {
		name           string
		entry          plugin.Entry
		value, present bool
	}{
		{"false", plan.Entries[0], false, true},
		{"true", plan.Entries[1], true, true},
		{"missing", plan.Entries[2], false, false},
		{"nil-config", plugin.Entry{}, false, false},
		{"null", plugin.Entry{Config: map[string]any{"numeric": nil}}, false, false},
		{"string", plugin.Entry{Config: map[string]any{"numeric": "true"}}, false, false},
		{"number", plugin.Entry{Config: map[string]any{"numeric": 1}}, false, false},
	} {
		value, present := item.entry.BoolConfig("numeric")
		if value != item.value || present != item.present {
			t.Errorf("%s bool = (%v,%v), want (%v,%v)", item.name, value, present, item.value, item.present)
		}
	}
}
