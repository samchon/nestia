package test

import (
	"fmt"
	"strings"
	"testing"
)

// Verifies async alias payload projection preserves wide anonymous types.
//
// A checker display can abbreviate long types, but reflected client syntax must
// retain every authored member and its concrete generic argument.
//
//  1. Analyze an empty payload and a generic anonymous payload with 200 members.
//  2. Require every projected IPoint member and its one declaration import.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must retain all 200 required IPoint-valued payload members and exactly the IPoint declaration binding, while the empty async payload has no import.
// @evidence contracts/testing.md#independent-expectations The authored Wide<T> explicitly requires each numbered member and is instantiated with IPoint; TypeScript client declarations cannot replace those members with checker display truncation. Empty object syntax requires no free declaration binding.
// @evidence contracts/testing.md#distinguishing-cases Empty and wide generic anonymous payloads contrast zero and repeated free type references; each independently named property must survive, and the repeated references must share one import rather than leaking the generic binder or wrapper alias.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this native Test and analyzes one authored program through EmitTransform. The temporary input and program are released without a product build, consumer install or runtime host.
func TestSyntheticAsyncAliasWidth(t *testing.T) {
	var source strings.Builder
	source.WriteString(`import core from "@nestia/core";
export interface IPoint { x: number; }
export type Empty = Promise<{}>;
export type Wide<T> = Promise<{
`)
	for index := 0; index < 200; index++ {
		fmt.Fprintf(&source, "  property%03d: T;\n", index)
	}
	source.WriteString(`}>;
export class SyntheticController {
  @core.TypedRoute.Get("empty")
  public empty(): Empty { return null!; }
  @core.TypedRoute.Get("wide")
  public wide(): Wide<IPoint> { return null!; }
}
`)
	literals := strings.Split(buildSyntheticMetadata(t, source.String()), "\n")
	if len(literals) != 2 {
		t.Fatalf("expected two operations, got %d", len(literals))
	}
	empty := syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "success")
	if actual := canonicalJSON(t, syntheticField(t, empty, "imports")); actual != `[]` {
		t.Errorf("empty payload imports = %s, want empty", actual)
	}
	wide := syntheticField(t, decodeSyntheticMetadata(t, literals[1]), "success")
	name := syntheticField(t, syntheticField(t, wide, "type"), "name").(string)
	for index := 0; index < 200; index++ {
		member := fmt.Sprintf("property%03d: IPoint;", index)
		if !strings.Contains(name, member) {
			t.Errorf("wide payload lost required member %s", member)
		}
	}
	imports := syntheticField(t, wide, "imports").([]any)
	if len(imports) != 1 || canonicalJSON(t, syntheticField(t, imports[0], "elements")) != `["IPoint"]` {
		t.Fatalf("wide payload imports = %v, want exactly IPoint", imports)
	}
}
