package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies the SDK names every WebSocket route whose handshake header it
// cannot send, and passes every header it can.
//
// The generated function carries the header as connection.headers, typed by
// `IConnection<Headers extends object | undefined>`, so a null, nullable, or
// primitive header produced an SDK that did not compile (#1701). tgrid leaves
// the header unconstrained, so such a route serves; the SDK must say so by
// name. The accepted side is exactly what that constraint admits: any, never,
// undefined, object types, and their unions; an intersection only of object
// types.
//
//  1. Author routes whose acceptor header, or @WebSocketRoute.Header() parameter,
//     is each rejected and each accepted type.
//  2. Run the SDK metadata pass over them in-process.
//  3. Assert each rejected parameter is reported with its type, and that the
//     reported diagnostics are exactly those and name no accepted type.
//
// @evidence contracts/testing.md#behavioral-verification SDK analysis must reject six unsendable header forms with their identifying reasons, report exactly those six and none of the eight supported header types.
// @evidence contracts/testing.md#independent-expectations WebSocket header transport permits undefined or object-like headers rather than null/scalars/unknown; the authored routes differ in the header type only and include a separately annotated Header parameter.
// @evidence contracts/testing.md#distinguishing-cases Null, string, nullable, unknown, branded scalar and numeric decorator negatives contrast undefined, object, interface, any, never, Record, optional and intersection positives. The diagnostic-position case pins method locations.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticWebSocketHeaderType(t *testing.T) {
	rejected := map[string]string{
		"nullHeader":         "null",
		"stringHeader":       "string",
		"nullableHeader":     "IHeader | null",
		"unknownHeader":      "unknown",
		"brandedString":      "string & {}",
		"headerDecoratorNum": "number",
	}
	var routes strings.Builder
	acceptor := func(name, header string) {
		routes.WriteString(`
  @core.WebSocketRoute("` + name + `")
  public async ` + name + `(
    @core.WebSocketRoute.Acceptor() acceptor: WebSocketAcceptor<` + header + `, IProvider, null>,
  ): Promise<void> {}
`)
	}
	acceptor("nullHeader", "null")
	acceptor("stringHeader", "string")
	acceptor("nullableHeader", "IHeader | null")
	acceptor("unknownHeader", "unknown")
	acceptor("brandedString", "string & {}")
	acceptor("undefinedHeader", "undefined")
	acceptor("objectHeader", "object")
	acceptor("interfaceHeader", "IHeader")
	acceptor("anyHeader", "any")
	acceptor("neverHeader", "never")
	acceptor("recordHeader", "Record<string, string>")
	acceptor("optionalHeader", "IHeader | undefined")
	acceptor("intersectionHeader", "IHeader & { extra: number }")
	routes.WriteString(`
  @core.WebSocketRoute("headerDecoratorNum")
  public async headerDecoratorNum(
    @core.WebSocketRoute.Acceptor() acceptor: WebSocketAcceptor<any, IProvider, null>,
    @core.WebSocketRoute.Header() headerDecoratorNum: number,
  ): Promise<void> {}
`)
	controller := `import core from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

export interface IHeader { name: string; }
export interface IProvider { greet(): string; }

export class SyntheticController {` + routes.String() + `}
`
	root := repoRoot(t)
	temp := t.TempDir()
	controllers := filepath.Join(temp, "src", "controllers")
	if err := os.MkdirAll(controllers, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(controllers, "SyntheticController.ts"), []byte(controller), 0o644); err != nil {
		t.Fatal(err)
	}
	writeSyntheticTsconfig(t, root, temp)
	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load synthetic program: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected synthetic load diagnostics: %v", diags)
	}
	defer prog.Close()

	_, reported := nativesdk.EmitTransform(prog)
	messages := make([]string, len(reported))
	for i, d := range reported {
		messages[i] = d.String("")
	}
	joined := strings.Join(messages, "\n")
	for name, header := range rejected {
		parameter := `parameter "acceptor"`
		if name == "headerDecoratorNum" {
			parameter = `parameter "headerDecoratorNum"`
		}
		if strings.Contains(joined, parameter+` has the header type "`+header+`", which the SDK cannot send`) == false {
			t.Errorf("route %s with header %q is not reported:\n%s", name, header, joined)
		}
	}
	// The diagnostics carry the header type but no route name, so the accepted
	// side is judged by the set of reported header types: exactly the six rejected
	// ones, once each, and none of the types the SDK can send.
	sendable := []string{"undefined", "object", "IHeader", "any", "never", "Record<string, string>", "IHeader | undefined", "IHeader & { extra: number }"}
	cannot := 0
	for _, message := range messages {
		if strings.Contains(message, "which the SDK cannot send") {
			cannot++
		}
		for _, header := range sendable {
			if strings.Contains(message, `has the header type "`+header+`"`) {
				t.Errorf("a sendable header %q is reported:\n%s", header, message)
			}
		}
	}
	if cannot != len(rejected) {
		t.Errorf("%d unsendable-header diagnostics were reported, expected %d:\n%s", cannot, len(rejected), joined)
	}
}
