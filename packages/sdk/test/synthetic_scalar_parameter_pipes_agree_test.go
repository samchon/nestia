package test

import (
	"encoding/json"
	"testing"
)

// TestSyntheticScalarParameterPipesAgree verifies a scalar route parameter's
// resolved metadata, which `@TypedParam()`, `@TypedQuery()`, and
// `@TypedHeaders()` read, carries the same structure as its primitive
// metadata, which a JSON `@TypedBody()` reads, and is never `any`.
//
// #1661 reported an alias-backed scalar such as `string & tags.Format<"uuid">`
// typed as its structure through a body but as `any` through a path
// parameter of a cloned SDK, and suggested the resolved metadata loses the
// alias. The two metadata differ only where JSON escaping changes a type, a
// `toJSON()` class or a native, none of which a path parameter admits. Each
// scalar alias shape below is pinned so a divergence cannot return unseen.
//
//  1. Author a route whose path parameters cover scalar aliases: a tagged
//     string, a generic tag alias, an indexed access, a namespace alias, an
//     enum, a template literal, a nullable, numeric, bigint, and boolean
//     aliases, a tagged union, a `typeof` union, a `keyof`, and `Primitive<>`.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each parameter's resolved metadata is not `any` and has the same
//     atomics, constants, templates, and nullability as its primitive one.
func TestSyntheticScalarParameterPipesAgree(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { Primitive, tags } from "typia";

export type PartyId = string & tags.Format<"uuid">;
export type Id<T extends string> = T & tags.Format<"uuid">;
export interface IParty { id: PartyId }
export namespace IParty { export type Id = PartyId; }
export enum Level { A = "a", B = "b" }
export type Code = ` + "`code-${number}`" + `;
export type Nullable = PartyId | null;
export type Seq = number & tags.Type<"uint32"> & tags.Minimum<1>;
export type Big = bigint & tags.Type<"uint64">;
export type Flag = boolean;
export type Either = (string & tags.Format<"uuid">) | (string & tags.Format<"email">);
export const KINDS = ["a", "b"] as const;
export type Kind = (typeof KINDS)[number];
export interface IShape { a: 1; b: 2 }
export type Wrapped = Primitive<PartyId>;

export class SyntheticController {
  @core.TypedRoute.Get("pipes")
  public get(
    @core.TypedParam("a") a: PartyId,
    @core.TypedParam("b") b: Id<string>,
    @core.TypedParam("c") c: IParty["id"],
    @core.TypedParam("d") d: IParty.Id,
    @core.TypedParam("e") e: Level,
    @core.TypedParam("f") f: Code,
    @core.TypedParam("g") g: Nullable,
    @core.TypedParam("h") h: Seq,
    @core.TypedParam("i") i: Big,
    @core.TypedParam("j") j: Flag,
    @core.TypedParam("k") k: Either,
    @core.TypedParam("l") l: Kind,
    @core.TypedParam("m") m: keyof IShape,
    @core.TypedParam("n") n: Wrapped,
  ): void {}
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	parameters := syntheticField(t, metadata, "parameters").([]any)
	if len(parameters) != 14 {
		t.Fatalf("expected 14 parameters, got %d", len(parameters))
	}
	for _, parameter := range parameters {
		name := syntheticField(t, parameter, "name")
		shapes := map[string]string{}
		for _, pipe := range []string{"primitive", "resolved"} {
			data := syntheticField(t, syntheticField(t, parameter, pipe), "data")
			m := syntheticField(t, data, "metadata").(map[string]any)
			if m["any"] != false {
				t.Fatalf("parameter %v has an %s metadata of any", name, pipe)
			}
			encoded, _ := json.Marshal([]any{m["atomics"], m["constants"], m["templates"], m["nullable"]})
			shapes[pipe] = string(encoded)
		}
		if shapes["primitive"] != shapes["resolved"] {
			t.Fatalf("parameter %v: resolved %s differs from primitive %s", name, shapes["resolved"], shapes["primitive"])
		}
	}
}
