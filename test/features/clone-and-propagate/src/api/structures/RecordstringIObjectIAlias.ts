import type { IArrayIIdentified } from "./IArrayIIdentified";
import type { IBooleanIIdentified } from "./IBooleanIIdentified";
import type { IEnumerationbooleanIIdentified } from "./IEnumerationbooleanIIdentified";
import type { IEnumerationnumberIIdentified } from "./IEnumerationnumberIIdentified";
import type { IEnumerationstringIIdentified } from "./IEnumerationstringIIdentified";
import type { IIntegerIIdentified } from "./IIntegerIIdentified";
import type { IJsonComponents } from "./IJsonComponents";
import type { INullOnlyIIdentified } from "./INullOnlyIIdentified";
import type { INumberIIdentified } from "./INumberIIdentified";
import type { IOneOfIIdentified } from "./IOneOfIIdentified";
import type { IReferenceIIdentified } from "./IReferenceIIdentified";
import type { IStringIIdentified } from "./IStringIIdentified";
import type { ITupleIIdentified } from "./ITupleIIdentified";
import type { IUnknownIIdentified } from "./IUnknownIIdentified";

/**
 * Construct a type with a set of properties K of type T
 */
export type RecordstringIObjectIAlias = {
    [key: string]: IJsonComponents.IObject | IEnumerationbooleanIIdentified | IEnumerationnumberIIdentified | IEnumerationstringIIdentified | IBooleanIIdentified | IIntegerIIdentified | INumberIIdentified | IStringIIdentified | IArrayIIdentified | ITupleIIdentified | IOneOfIIdentified | IReferenceIIdentified | INullOnlyIIdentified | IUnknownIIdentified;
}