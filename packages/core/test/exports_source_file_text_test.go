package test

import (
	"path/filepath"
	"runtime/debug"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcore "github.com/microsoft/typescript-go/shim/core"
	shimparser "github.com/microsoft/typescript-go/shim/parser"
	"github.com/samchon/nestia/packages/core/native/transform"
)

type textOnly struct{ body string }

func (t textOnly) Text() string { return t.body }

// nilSafeText can supply text even when its receiver is nil. The accessor's
// absent-source policy still rejects a missing receiver before dispatch.
type nilSafeText struct{}

func (*nilSafeText) Text() string { return "nil-safe provider" }

// Named nil-capable providers exercise receiver identity independently of the
// compiler's concrete pointer type. Empty present containers remain providers.
type mapText map[string]string

func (mapText) Text() string { return "map provider" }

type sliceText []string

func (sliceText) Text() string { return "slice provider" }

type channelText chan string

func (channelText) Text() string { return "channel provider" }

type functionText func() string

func (f functionText) Text() string { return f() }

// TestExportsSourceFileText verifies the exported SourceFileText helper returns
// the underlying text of present structural providers and rejects missing or
// foreign source values without invoking a missing receiver.
//
// SourceFileText is the duck-typed bridge other Go modules use to read a
// SourceFile's verbatim text without importing tsgo's concrete type. A typed
// nil can satisfy Text() while owning no source, so interface membership alone
// cannot establish safe dispatch. The present-provider twins keep rejection
// from turning valid empty containers or real source into missing input.
//
//  1. Pass ordinary and actual parsed source providers and require exact text.
//  2. Reject missing and foreign input, including a typed nil compiler source.
//  3. Reject all missing receiver kinds and preserve each present-provider twin.
//
// @evidence contracts/testing.md#behavioral-verification SourceFileText returns exact authored text from present ordinary, parsed and named-container providers, including empty text with true, while foreign/untyped nil/typed nil input returns empty text and false without panic. A nil-safe pointer is still absent; its non-nil twin must dispatch normally.
// @evidence contracts/testing.md#independent-expectations Literal source and fixture Text methods establish returned bytes independently. Present empty source independently requires true despite empty text; the accepted absent-source contract rejects missing receiver identity before invocation, even when a provider could handle nil. Present empty containers similarly differ from missing ones.
// @evidence contracts/testing.md#distinguishing-cases Nonempty/empty ordinary and parsed source providers, number and untyped nil accompany typed nil compiler input and nil/non-nil pointer/map/slice/channel/function provider twins. Unexpected panic records a failing subcase while adjacent controls continue.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this direct operation test and uses the existing parser on authored text. There is no driver program, emission, product build, binary, installation or child process.
func TestExportsSourceFileText(t *testing.T) {
	source := "const a = 1;"
	parsed := shimparser.ParseSourceFile(shimast.SourceFileParseOptions{FileName: filepath.ToSlash(filepath.Join(t.TempDir(), "source.ts"))}, source, shimcore.ScriptKindTS)
	emptyParsed := shimparser.ParseSourceFile(shimast.SourceFileParseOptions{FileName: filepath.ToSlash(filepath.Join(t.TempDir(), "empty.ts"))}, "", shimcore.ScriptKindTS)
	var missing *shimast.SourceFile
	var safe *nilSafeText
	for _, item := range []struct {
		name   string
		target any
		text   string
		ok     bool
	}{
		{"ordinary-provider", textOnly{body: source}, source, true},
		{"empty-ordinary-provider", textOnly{}, "", true},
		{"parsed-source", parsed, source, true},
		{"empty-parsed-source", emptyParsed, "", true},
		{"foreign-value", 42, "", false},
		{"untyped-nil", nil, "", false},
		{"typed-nil-source", missing, "", false},
		{"nil-safe-provider-absent", safe, "", false},
		{"nil-safe-provider-present", &nilSafeText{}, "nil-safe provider", true},
		{"nil-map-provider", mapText(nil), "", false},
		{"empty-map-provider", mapText{}, "map provider", true},
		{"nil-slice-provider", sliceText(nil), "", false},
		{"empty-slice-provider", sliceText{}, "slice provider", true},
		{"nil-channel-provider", channelText(nil), "", false},
		{"present-channel-provider", make(channelText), "channel provider", true},
		{"nil-function-provider", functionText(nil), "", false},
		{"present-function-provider", functionText(func() string { return "function provider" }), "function provider", true},
	} {
		t.Run(item.name, func(t *testing.T) {
			defer func() {
				if failure := recover(); failure != nil {
					t.Errorf("SourceFileText unexpectedly panicked: %v\n%s", failure, debug.Stack())
				}
			}()
			text, ok := transform.SourceFileText(item.target)
			if text != item.text || ok != item.ok {
				t.Fatalf("expected (%q,%v), got (%q,%v)", item.text, item.ok, text, ok)
			}
		})
	}
}
