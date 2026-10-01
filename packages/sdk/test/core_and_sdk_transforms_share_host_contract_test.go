package test

import (
	"github.com/samchon/nestia/packages/core/native/plugin"
	"testing"
)

// @evidence contracts/testing.md#behavioral-verification ParsePlan must activate both Core and SDK when their supported transform descriptors share one manifest.
// @evidence contracts/testing.md#independent-expectations The composition contract accepts both package entries in a single host plan; the literal descriptor fixture is resolver input rather than a committed manifest equality check.
// @evidence contracts/testing.md#distinguishing-cases This is joint activation; the SDK-only case requires Core false and UsesNestia true, and the core plan tests own unrelated/empty forms.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestCoreAndSDKTransformsShareHostContract(t *testing.T) {
	plan, err := plugin.ParsePlan(`[
		{"name":"@nestia/core","config":{"transform":"@nestia/core/lib/transform"}},
		{"name":"@nestia/sdk","config":{"transform":"@nestia/sdk/lib/transform"}}
	]`)
	if err != nil {
		t.Fatal(err)
	}
	if !plan.Core || !plan.SDK {
		t.Fatal("expected core and sdk transforms to be co-hosted")
	}
}
