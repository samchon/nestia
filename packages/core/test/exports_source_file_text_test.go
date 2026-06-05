package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

type textOnly struct{ body string }

func (t textOnly) Text() string { return t.body }

// TestExportsSourceFileText verifies the exported SourceFileText helper returns
// the underlying source text only when its argument satisfies the unexported
// `Text() string` shape, and reports `ok == false` otherwise.
//
// SourceFileText is the duck-typed bridge other Go modules use to read a
// SourceFile's verbatim text without importing tsgo's concrete type. A
// regression in the type assertion would make every contributor read empty
// source while silently reporting success, so both branches must be pinned.
//
//  1. Pass a value implementing Text() and assert the text and ok==true.
//  2. Pass a value that does not implement Text() and assert ok==false.
func TestExportsSourceFileText(t *testing.T) {
	text, ok := transform.SourceFileText(textOnly{body: "const a = 1;"})
	if !ok || text != "const a = 1;" {
		t.Fatalf("expected (%q,true), got (%q,%v)", "const a = 1;", text, ok)
	}
	if got, ok := transform.SourceFileText(42); ok || got != "" {
		t.Fatalf("non-text value must report ok=false, got (%q,%v)", got, ok)
	}
}
