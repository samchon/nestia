package test

import (
	"strings"
	"testing"
)

// TestTransformFeatureDiagnosticMessages verifies four rejected route shapes retain their diagnostic reasons.
//
// Counts alone could accept an unrelated rejection; the authored nested properties and acceptor contracts require these reasons.
//
// 1. Transform each named negative fixture in-process.
// 2. Require exactly one diagnostic and all of that fixture's identifying phrases.
//
// @evidence contracts/testing.md#behavioral-verification Each nested form/query or invalid acceptor arity/import fixture must return exactly one diagnostic containing its own unsupported-type/property or required acceptor message.
// @evidence contracts/testing.md#independent-expectations The authored nested field names and the required WebSocketAcceptor<Header, Provider, Listener> contract establish the literal diagnostic reasons independently of the transform output.
// @evidence contracts/testing.md#distinguishing-cases Four fixture identities retain independent count/message assertions; broad cohorts own the other rejected features and successful query/multipart/WebSocket cases own valid inputs.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformFeatureDiagnosticMessages(t *testing.T) {
	for feature, needles := range map[string][]string{
		"form-data-error-nested": {
			"unsupported type detected",
			"INestedForm.nested",
			"nested object type is not allowed.",
		},
		"query-route-error-nested": {
			"unsupported type detected",
			"INestedQueryOutput.nested",
			"nested object type is not allowed.",
		},
		"websocket-error-invalid-acceptor-arity": {
			`parameter "acceptor" must have WebSocketAcceptor<Header, Provider, Listener> type.`,
		},
		"websocket-error-invalid-acceptor-import": {
			`parameter "acceptor" must have WebSocketAcceptor<Header, Provider, Listener> type.`,
		},
	} {
		diagnostics := transformFeatureDiagnostics(t, map[string]int{feature: 1})
		if len(diagnostics) != 1 {
			t.Errorf("%s reported %d diagnostics; expected 1: %v", feature, len(diagnostics), diagnostics)
			continue
		}
		for _, needle := range needles {
			if strings.Contains(diagnostics[0].message, needle) == false {
				t.Errorf("%s diagnostic misses %q:\n%s", feature, needle, diagnostics[0].message)
			}
		}
	}
}

// transformFeatureCohort runs the project-mode transform over the controllers
// of the given test-sdk features, returning the file of each diagnostic.
