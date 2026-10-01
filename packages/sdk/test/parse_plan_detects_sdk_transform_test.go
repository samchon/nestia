package test

import (
	"github.com/samchon/nestia/packages/core/native/plugin"
	"testing"
)

// @evidence contracts/testing.md#behavioral-verification ParsePlan on the SDK-only descriptor must set SDK and UsesNestia while leaving Core false.
// @evidence contracts/testing.md#independent-expectations The public SDK descriptor denotes the SDK contributor independently of core activation; UsesNestia includes either package.
// @evidence contracts/testing.md#distinguishing-cases Three flags distinguish contributor recognition from accidental core recognition. Joint activation and core-only/empty plan cases supply adjacent forms.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestParsePlanDetectsSDKTransform(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"name":"@nestia/sdk","config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.SDK {
		t.Fatal("expected @nestia/sdk transform to be detected")
	}
	if plan.Core {
		t.Fatal("did not expect @nestia/core transform")
	}
	if !plan.UsesNestia() {
		t.Fatal("expected SDK transform to count as a Nestia transform")
	}
}
