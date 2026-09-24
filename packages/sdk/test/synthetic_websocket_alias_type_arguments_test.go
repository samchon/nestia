package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies the SDK reflects an @WebSocketRoute.Acceptor() or .Driver()
// parameter typed through a type alias or an import type as the tgrid type it
// spells, with each type argument the generated client needs.
//
// The SDK reads the acceptor's Header, Provider and Listener from the type
// arguments of the annotation, which an alias does not write: `LocalAcceptor`
// has none and `ProviderAcceptor<IProvider>` has one (#1671). The arguments
// live in the alias declaration, and a generic alias's are its own type
// parameters, so each is followed back to what the annotation passes, or to the
// parameter's default, through any number of aliases. The annotation's own
// reflection reads an import type such as `import("tgrid").Driver<IListener>`
// as a name without arguments, so it is read the same way.
//
//  1. Author routes typing the acceptor by a local alias, a generic alias with
//     and without its default, a parenthesized parameter, an alias of a generic
//     alias, a generic alias passing its parameter to another, and an import
//     type, and the driver by an alias and an import type.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert every acceptor reflects `WebSocketAcceptor<IHeader, IProvider,
//     IListener>` and the driver `Driver<IListener>`.
func TestSyntheticWebSocketAliasTypeArguments(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { Driver, WebSocketAcceptor as Acceptor } from "tgrid";

export interface IHeader { name: string; }
export interface IProvider { greet(): string; }
export interface IListener { notify(route: string): void; }

type LocalAcceptor = Acceptor<IHeader, IProvider, IListener>;
type ProviderAcceptor<Provider extends object = IProvider> = Acceptor<IHeader, Provider, IListener>;
type ParenthesizedAcceptor<Provider extends object> = Acceptor<IHeader, (Provider), IListener>;
type ChainedAcceptor = ProviderAcceptor<IProvider>;
type OuterAcceptor<Inner extends object> = ProviderAcceptor<Inner>;
type ListenerDriver = Driver<IListener>;

export class SyntheticController {
  @core.WebSocketRoute("local")
  public async local(
    @core.WebSocketRoute.Acceptor() acceptor: LocalAcceptor,
    @core.WebSocketRoute.Driver() driver: ListenerDriver,
  ): Promise<void> {}

  @core.WebSocketRoute("generic")
  public async generic(
    @core.WebSocketRoute.Acceptor() acceptor: ProviderAcceptor<IProvider>,
  ): Promise<void> {}

  @core.WebSocketRoute("defaulted")
  public async defaulted(
    @core.WebSocketRoute.Acceptor() acceptor: ProviderAcceptor,
  ): Promise<void> {}

  @core.WebSocketRoute("parenthesized")
  public async parenthesized(
    @core.WebSocketRoute.Acceptor() acceptor: ParenthesizedAcceptor<IProvider>,
  ): Promise<void> {}

  @core.WebSocketRoute("chained")
  public async chained(
    @core.WebSocketRoute.Acceptor() acceptor: ChainedAcceptor,
  ): Promise<void> {}

  @core.WebSocketRoute("outer")
  public async outer(
    @core.WebSocketRoute.Acceptor() acceptor: OuterAcceptor<IProvider>,
  ): Promise<void> {}

  @core.WebSocketRoute("imported")
  public async imported(
    @core.WebSocketRoute.Acceptor() acceptor: import("tgrid").WebSocketAcceptor<IHeader, IProvider, IListener>,
    @core.WebSocketRoute.Driver() driver: import("tgrid").Driver<IListener>,
  ): Promise<void> {}
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 7 {
		t.Fatalf("expected metadata of 7 routes, got %d", len(literals))
	}
	for index, literal := range literals {
		parameters, _ := syntheticField(t, decodeSyntheticMetadata(t, literal), "parameters").([]any)
		if len(parameters) == 0 {
			t.Fatalf("route %d has no parameter metadata", index)
		}
		assertSyntheticReflectedType(t, syntheticField(t, parameters[0], "type"), "WebSocketAcceptor", "IHeader", "IProvider", "IListener")
		if index == 0 || index == 6 {
			assertSyntheticReflectedType(t, syntheticField(t, parameters[1], "type"), "Driver", "IListener")
		}
	}
}

// Verifies the SDK refuses, by name, an acceptor alias using its type
// parameter inside a type argument.
//
// `RoomAcceptor<Member>` passes `IRoom<Member>` as the provider: the route's
// type is tgrid's acceptor and serves, but no written node spells the provider
// the route passes, `IRoom<string>`, and reflecting the alias's text would
// write an unresolved `Member` into the generated client.
//
//  1. Author a route typing its acceptor by such an alias.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert it reports the parameter, the argument, and the way out.
func TestSyntheticWebSocketAliasTypeArgumentUnspellable(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

export interface IRoom<Member> { members(): Member[]; }
type RoomAcceptor<Member> = WebSocketAcceptor<null, IRoom<Member>, null>;

export class SyntheticController {
  @core.WebSocketRoute("room")
  public async room(
    @core.WebSocketRoute.Acceptor() acceptor: RoomAcceptor<string>,
  ): Promise<void> {}
}
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
	for _, expected := range []string{
		`@WebSocketRoute.Acceptor() parameter "acceptor"`,
		`WebSocketAcceptor type argument "IRoom<Member>"`,
		"Pass each type parameter as a whole type argument",
	} {
		if strings.Contains(joined, expected) == false {
			t.Fatalf("diagnostics miss %q:\n%s", expected, joined)
		}
	}
}

// assertSyntheticReflectedType asserts a reflected type is name with type
// arguments of the given names.
func assertSyntheticReflectedType(t *testing.T, reflected any, name string, arguments ...string) {
	t.Helper()
	if actual := syntheticField(t, reflected, "name"); actual != name {
		t.Fatalf("reflected type is %v, not %s", actual, name)
	}
	args, _ := syntheticField(t, reflected, "typeArguments").([]any)
	if len(args) != len(arguments) {
		t.Fatalf("%s reflects %d type arguments, not %d: %v", name, len(args), len(arguments), args)
	}
	for i, argument := range arguments {
		if actual := syntheticField(t, args[i], "name"); actual != argument {
			t.Fatalf("%s type argument %d is %v, not %s", name, i, actual, argument)
		}
	}
}
