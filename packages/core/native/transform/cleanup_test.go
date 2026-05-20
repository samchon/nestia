package transform

import (
	"strings"
	"testing"
)

func TestCleanupTransformedTextWithRuntimeAliases(t *testing.T) {
	input := strings.Join([]string{
		`"use strict";`,
		`const typia_1 = require("typia");`,
		`const value = __typia_transform__isTypeInt32(input);`,
		``,
	}, "\n")

	output := cleanupTransformedTextWithRuntimeAliases(
		input,
		[]string{"__typia_transform__isTypeInt32"},
	)

	if strings.Contains(output, `require("typia");`) {
		t.Fatalf("unused typia import was not removed:\n%s", output)
	}
	expected := `const { _isTypeInt32: __typia_transform__isTypeInt32 } = require("typia/lib/internal/_isTypeInt32");`
	if strings.Contains(output, expected) == false {
		t.Fatalf("runtime import was not injected:\n%s", output)
	}
	if strings.Index(output, expected) >= strings.Index(output, "const value") {
		t.Fatalf("runtime import was inserted after usage:\n%s", output)
	}
}

func TestCleanupTransformedTextKeepsReferencedTypiaImport(t *testing.T) {
	input := strings.Join([]string{
		`"use strict";`,
		`const typia_1 = require("typia");`,
		`const value = typia_1.default.assert(input);`,
		``,
	}, "\n")

	output := cleanupTransformedTextWithRuntimeAliases(input, []string{})
	if strings.Contains(output, `const typia_1 = require("typia");`) == false {
		t.Fatalf("referenced typia import was removed:\n%s", output)
	}
}

func TestCleanupTransformedTextDoesNotDuplicateRuntimeImport(t *testing.T) {
	existing := `const { _isTypeInt32: __typia_transform__isTypeInt32 } = require("typia/lib/internal/_isTypeInt32");`
	input := strings.Join([]string{
		`"use strict";`,
		existing,
		`const value = __typia_transform__isTypeInt32(input);`,
		``,
	}, "\n")

	output := cleanupTransformedTextWithRuntimeAliases(
		input,
		[]string{"__typia_transform__isTypeInt32"},
	)
	if strings.Count(output, existing) != 1 {
		t.Fatalf("runtime import was duplicated:\n%s", output)
	}
}

func TestNativeRewriteSetCollectsRuntimeAliasesFromAppendArguments(t *testing.T) {
	rewrites := newNativeRewriteSet()
	rewrites.Add(nativeRewrite{
		FilePath:        "/project/src/controller.ts",
		AppendArguments: []string{`__typia_transform__httpQueryParseURLSearchParams(input)`},
	})

	aliases := rewrites.RuntimeAliasesForOutput("/project/lib/controller.js")
	if len(aliases) != 1 || aliases[0] != "__typia_transform__httpQueryParseURLSearchParams" {
		t.Fatalf("unexpected aliases: %#v", aliases)
	}
}
