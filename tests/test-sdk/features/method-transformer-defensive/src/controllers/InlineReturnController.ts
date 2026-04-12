import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("inline-return")
export class InlineReturnController {
  @TypedRoute.Get("anonymous")
  public anonymous(): Promise<{ foo: string; bar?: number }> {
    return Promise.resolve({ foo: "ok" });
  }

  @TypedRoute.Get("intersection")
  public intersection(): Promise<IX & IY> {
    return Promise.resolve({ x: 1, y: "hi" });
  }

  @TypedRoute.Get("return-type")
  public returnType(): Promise<ReturnType<typeof getItem>> {
    return Promise.resolve(getItem());
  }

  @TypedRoute.Get("inferred")
  public inferred(): Promise<InferReturn<() => IItem>> {
    return Promise.resolve({ id: 1, label: "item" });
  }
}

interface IX {
  x: number;
}
interface IY {
  y: string;
}
interface IItem {
  id: number;
  label: string;
}

type InferReturn<T> = T extends (...args: any[]) => infer R ? R : never;

function getItem(): IItem {
  return { id: 1, label: "item" };
}
