import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";
import { IMetadataDictionary } from "typia/lib/schemas/metadata/IMetadataDictionary";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataComponents } from "typia/lib/schemas/metadata/MetadataComponents";
import { MetadataObjectType } from "typia/lib/schemas/metadata/MetadataObjectType";
import { Escaper } from "typia/lib/utils/Escaper";

import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedHttpRouteException } from "../structures/ITypedHttpRouteException";
import { ITypedHttpRouteParameter } from "../structures/ITypedHttpRouteParameter";
import { ITypedHttpRouteSuccess } from "../structures/ITypedHttpRouteSuccess";
import { PathUtil } from "../utils/PathUtil";

export namespace TypedHttpRouteAnalyzer {
  export const dictionary = (
    controllers: IReflectController[],
  ): IMetadataDictionary => {
    const individual: IMetadataComponents[] = [];
    for (const c of controllers)
      for (const o of c.operations) {
        if (o.protocol !== "http") continue;
        if (o.success) individual.push(o.success.components);
        for (const p of o.parameters) individual.push(p.components);
        for (const e of Object.values(o.exceptions))
          individual.push(e.components);
      }
    const components: MetadataComponents = MetadataComponents.from({
      objects: Object.values(
        Object.fromEntries(
          individual.map((c) => c.objects.map((o) => [o.name, o])).flat(),
        ),
      ),
      arrays: Object.values(
        Object.fromEntries(
          individual.map((c) => c.arrays.map((a) => [a.name, a])).flat(),
        ),
      ),
      tuples: Object.values(
        Object.fromEntries(
          individual.map((c) => c.tuples.map((t) => [t.name, t])).flat(),
        ),
      ),
      aliases: Object.values(
        Object.fromEntries(
          individual.map((c) => c.aliases.map((a) => [a.name, a])).flat(),
        ),
      ),
    });
    return components.dictionary;
  };

  export const analyze = (props: {
    controller: IReflectController;
    errors: IReflectOperationError[];
    dictionary: IMetadataDictionary;
    operation: IReflectHttpOperation;
    paths: string[];
  }): ITypedHttpRoute[] => {
    const errors: IReflectOperationError[] = [];
    const cast = (
      next: {
        metadata: IMetadata;
        validate: MetadataFactory.Validator;
      },
      from: string,
      escape: boolean,
    ): Metadata => {
      const metadata: Metadata = Metadata.from(next.metadata, props.dictionary);
      const metaErrors: MetadataFactory.IError[] = MetadataFactory.validate({
        options: {
          escape,
          constant: true,
          absorb: true,
          validate: next.validate, // @todo -> CHECK IN TYPIA
        },
        functor: next.validate, // @todo -> CHECK IN TYPIA
        metadata,
      });
      if (metaErrors.length)
        errors.push({
          file: props.controller.file,
          class: props.controller.class.name,
          function: props.operation.name,
          from,
          contents: metaErrors.map((e) => ({
            name: e.name,
            accessor:
              e.explore.object !== null
                ? join({
                    object: e.explore.object,
                    key: e.explore.property,
                  })
                : null,
            messages: e.messages,
          })),
        });
      return metadata;
    };
    const exceptions: Record<
      number | "2XX" | "3XX" | "4XX" | "5XX",
      ITypedHttpRouteException
    > = Object.fromEntries(
      Object.entries(props.operation.exceptions).map(([key, value]) => [
        key as any,
        {
          status: value.status,
          description: value.description,
          example: value.example,
          examples: value.examples,
          type: value.type,
          metadata: cast(value, `exception (status: ${key})`, true),
        },
      ]),
    );
    const parameters: ITypedHttpRouteParameter[] =
      props.operation.parameters.map((p) => ({
        ...p,
        metadata: cast(
          p,
          `parameter (name: ${JSON.stringify(p.name)})`,
          p.category === "body" &&
            (p.contentType === "application/json" || p.encrypted === true),
        ),
      }));
    const success: ITypedHttpRouteSuccess = {
      ...props.operation.success,
      metadata: cast(
        props.operation.success,
        "success",
        props.operation.success.encrypted ||
          props.operation.success.contentType === "application/json",
      ),
      setHeaders: props.operation.jsDocTags
        .filter(
          (t) =>
            t.text?.length &&
            t.text[0].text &&
            (t.name === "setHeader" || t.name === "assignHeaders"),
        )
        .map((t) =>
          t.name === "setHeader"
            ? {
                type: "setter",
                source: t.text![0].text.split(" ")[0].trim(),
                target: t.text![0].text.split(" ")[1]?.trim(),
              }
            : {
                type: "assigner",
                source: t.text![0].text,
              },
        ),
    };
    if (errors.length) {
      props.errors.push(...errors);
      return [];
    }
    return props.paths.map((path) => ({
      ...props.operation,
      controller: props.controller,
      path,
      accessors: [...PathUtil.accessors(path), props.operation.name],
      exceptions,
      parameters,
      success,
      extensions: props.operation.extensions,
    }));
  };
}

const join = ({
  object,
  key,
}: {
  object: MetadataObjectType;
  key: string | object | null;
}) => {
  if (key === null) return object.name;
  else if (typeof key === "object") return `${object.name}[key]`;
  else if (Escaper.variable(key)) return `${object.name}.${key}`;
  return `${object.name}[${JSON.stringify(key)}]`;
};
