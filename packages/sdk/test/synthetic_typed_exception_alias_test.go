package test

import (
	"strings"
	"testing"
)

// Verifies the SDK metadata pass reflects a `@TypedException<T>()` however
// `@nestia/core` is imported: aliased, named, default, or as a namespace.
//
// The decorator was recognized by its lexical callee name, so an aliased
// import (`TypedException as Exception`) was skipped while the runtime still
// registered the exception, and the SDK failed with "Unable to find exception
// type" (#1732).
//
//  1. Author one controller per import spelling, each with a typed exception.
//  2. Run the SDK metadata pass.
//  3. Assert each method's metadata holds exactly one exception of its type.
func TestSyntheticTypedExceptionAlias(t *testing.T) {
	for spelling, controller := range map[string]string{
		"alias": `import { TypedException as Exception, TypedRoute } from "@nestia/core";
export interface IMissing { message: string; }
export class SyntheticController {
  @Exception<IMissing>(404, "missing")
  @TypedRoute.Get()
  public get(): number { return 0; }
}
`,
		"named": `import { TypedException, TypedRoute } from "@nestia/core";
export interface IMissing { message: string; }
export class SyntheticController {
  @TypedException<IMissing>(404, "missing")
  @TypedRoute.Get()
  public get(): number { return 0; }
}
`,
		"default": `import core from "@nestia/core";
export interface IMissing { message: string; }
export class SyntheticController {
  @core.TypedException<IMissing>(404, "missing")
  @core.TypedRoute.Get()
  public get(): number { return 0; }
}
`,
		"namespace": `import * as nestia from "@nestia/core";
export interface IMissing { message: string; }
export class SyntheticController {
  @nestia.TypedException<IMissing>(404, "missing")
  @nestia.TypedRoute.Get()
  public get(): number { return 0; }
}
`,
	} {
		literal := buildSyntheticMetadata(t, controller)
		if strings.Contains(literal, "\n") {
			t.Fatalf("%s: expected one method's metadata, got:\n%s", spelling, literal)
		}
		exceptions, ok := syntheticField(t, decodeSyntheticMetadata(t, literal), "exceptions").([]any)
		if !ok || len(exceptions) != 1 {
			t.Errorf("%s: expected one exception, got %v", spelling, exceptions)
			continue
		}
		if name := syntheticField(t, syntheticField(t, exceptions[0], "type"), "name"); name != "IMissing" {
			t.Errorf("%s: exception type is %v, not IMissing", spelling, name)
		}
	}
}
