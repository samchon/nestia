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
//  3. Assert each rejected parameter is reported with its type, and no accepted
//     one is.
func TestSyntheticWebSocketHeaderType(t *testing.T) {
	rejected := map[string]string{
		"nullHeader":         "null",
		"stringHeader":       "string",
		"nullableHeader":     "IHeader | null",
		"unknownHeader":      "unknown",
		"brandedString":      "string & {}",
		"headerDecoratorNum": "number",
	}
	accepted := []string{
		"undefinedHeader",
		"objectHeader",
		"interfaceHeader",
		"anyHeader",
		"neverHeader",
		"recordHeader",
		"optionalHeader",
		"intersectionHeader",
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
	for _, name := range accepted {
		for _, message := range messages {
			if strings.Contains(message, "which the SDK cannot send") && strings.Contains(message, name) {
				t.Errorf("route %s is reported although the SDK can send its header:\n%s", name, message)
			}
		}
	}
}
