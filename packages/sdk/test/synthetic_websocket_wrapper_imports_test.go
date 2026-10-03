package test

import (
	"reflect"
	"sort"
	"strings"
	"testing"
)

// Verifies WebSocket wrapper imports follow the types written by the client.
//
// The client writes the acceptor's three arguments and the driver's argument,
// not their server-side aliases. Carrying those outer bindings into the SDK
// creates unused imports and breaks the shared strict consumer. A wrapper used
// inside an actual argument remains necessary, as does an ordinary HTTP type.
//
//  1. Analyze renamed outer wrappers, a nested wrapper argument and an HTTP
//     response using the same imported binding in one authored program.
//  2. Reject outer-only bindings and retain the two independently needed uses.
//
// @evidence contracts/testing.md#behavioral-verification Actual EmitTransform metadata excludes renamed Acceptor and Remote imports used only as WebSocket wrappers, retains Remote used as a header type argument, and preserves Acceptor as an ordinary HTTP response type.
// @evidence contracts/testing.md#independent-expectations The generated client declares Header, Provider and Listener from wrapper arguments. Authored TypeScript annotations distinguish that projection from an argument or HTTP response which actually names the imported wrapper.
// @evidence contracts/testing.md#distinguishing-cases Renamed outer acceptor/driver bindings are the negative controls; the same driver binding inside a header argument and the acceptor binding in an HTTP response must remain. Exact argument counts and names preserve the projection's meaning.
// @evidence contracts/testing.md#execution-ownership The SDK Go unit runner discovers this matching Test. One authored program is loaded and analyzed in-process, with no installation, native host, product compilation or runtime connection; the shared strict SDK consumer owns the generated-byte connection.
func TestSyntheticWebSocketWrapperImports(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { Driver as Remote, WebSocketAcceptor as Acceptor } from "tgrid";

export interface IHeader { name: string; }
export interface IProvider { greet(): string; }
export interface IListener { notify(value: string): void; }

export class SyntheticController {
  @core.WebSocketRoute("outer")
  public async outer(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor<IHeader, IProvider, IListener>,
    @core.WebSocketRoute.Driver() driver: Remote<IListener>,
  ): Promise<void> {}

  @core.WebSocketRoute("nested")
  public async nested(
    @core.WebSocketRoute.Acceptor() acceptor: Acceptor<Remote<IListener>, IProvider, IListener>,
  ): Promise<void> {}

  @core.TypedRoute.Get("ordinary")
  public ordinary(): Acceptor<IHeader, IProvider, IListener> { return null!; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 3 {
		t.Fatalf("expected three authored operations, got %d", len(literals))
	}
	outer := syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "parameters").([]any)
	importNames := func(value any) []string {
		var names []string
		for _, imported := range syntheticField(t, value, "imports").([]any) {
			for _, name := range syntheticField(t, imported, "elements").([]any) {
				names = append(names, name.(string))
			}
		}
		sort.Strings(names)
		return names
	}
	for index, expected := range [][]string{{"IHeader", "IListener", "IProvider"}, {"IListener"}} {
		if actual := importNames(outer[index]); !reflect.DeepEqual(actual, expected) {
			t.Errorf("outer parameter %d imports = %v, want only %v", index, actual, expected)
		}
	}
	nested := syntheticField(t, decodeSyntheticMetadata(t, literals[1]), "parameters").([]any)
	if actual := importNames(nested[0]); !reflect.DeepEqual(actual, []string{"IListener", "IProvider", "Remote"}) {
		t.Errorf("nested header imports = %v, want [IListener IProvider Remote]", actual)
	}
	success := syntheticField(t, decodeSyntheticMetadata(t, literals[2]), "success")
	if actual := importNames(success); !reflect.DeepEqual(actual, []string{"Acceptor", "IHeader", "IListener", "IProvider"}) {
		t.Errorf("HTTP response imports = %v, want [Acceptor IHeader IListener IProvider]", actual)
	}
	assertSyntheticReflectedType(t, syntheticField(t, outer[0], "type"), "WebSocketAcceptor", "IHeader", "IProvider", "IListener")
	assertSyntheticReflectedType(t, syntheticField(t, outer[1], "type"), "Driver", "IListener")
}
