package test

import (
	"encoding/json"
	"strings"
	"testing"
)

// TestSyntheticNonIdentifierNames verifies the SDK metadata pass bakes every
// decorated method whose parameter or method name is no identifier, instead
// of crashing on it.
//
// The pass visits every decorated method of the program, controller or not,
// because which class is a controller is only known at run time. It read each
// parameter's and method's name with typescript-go's `Text()`, which panics on
// a destructuring pattern and on a computed name, so one `@Span()`-traced
// repository method taking `{ organizationId }` failed `nestia sdk` for the
// whole project (#1660). A destructured parameter declares no name, so it is
// baked with an empty one, which the SDK replaces with a name of its own; a
// computed method still gets its metadata, which a decorator attaches under
// the key the runtime computes.
//
//  1. Author a non-controller class whose decorated methods take an object
//     and an array pattern or have a literal and an expression computed name,
//     and a route whose body parameter is destructured beside a named one.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert one metadata literal per decorated method, each listing its
//     parameters' names: empty for a pattern, the identifier otherwise.
//
// @evidence contracts/testing.md#behavioral-verification Metadata for five decorated methods must publish the exact parameter-name vectors, including empty names for destructuring and the ordinary query identifier.
// @evidence contracts/testing.md#independent-expectations Object/array binding patterns have no single identifier name, computed method names are valid declarations, and an ordinary parameter retains its authored query name.
// @evidence contracts/testing.md#distinguishing-cases Object destructuring, array destructuring, literal/dynamic computed methods and a route mixing destructured body with a named query distinguish safe node-name handling from inventing names or dropping methods.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticNonIdentifierNames(t *testing.T) {
	const controller = `import core from "@nestia/core";

const Span = (): MethodDecorator => () => {};
const key = "dynamic";

export interface IBody {
  title: string;
}

export class Repository {
  @Span()
  public async findPending({ organizationId }: { organizationId: string }): Promise<string> {
    return organizationId;
  }

  @Span()
  public first([head]: string[]): string {
    return head ?? "";
  }

  @Span()
  public ["literal-name"](): string {
    return "literal";
  }

  @Span()
  public [key](): string {
    return key;
  }
}

export class SyntheticController {
  @core.TypedRoute.Post()
  public create(
    @core.TypedBody() { title }: IBody,
    @core.TypedQuery() query: { page?: number },
  ): string {
    return title + String(query.page);
  }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	names := []string{}
	for _, literal := range literals {
		parameters := []string{}
		for _, parameter := range syntheticField(t, decodeSyntheticMetadata(t, literal), "parameters").([]any) {
			parameters = append(parameters, syntheticField(t, parameter, "name").(string))
		}
		encoded, _ := json.Marshal(parameters)
		names = append(names, string(encoded))
	}
	if actual, expected := strings.Join(names, " "), `[""] [""] [] [] ["","query"]`; actual != expected {
		t.Fatalf("parameter names per decorated method are %s, expected %s", actual, expected)
	}
}
