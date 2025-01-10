import { INestiaAgentConfig } from "../structures/INestiaAgentConfig";
import { INestiaAgentController } from "../structures/INestiaAgentController";
import { INestiaAgentOperation } from "../structures/INestiaAgentOperation";
import { INestiaAgentOperationCollection } from "../structures/INestiaAgentOperationCollection";
import { __map_take } from "./__map_take";

export namespace NestiaAgentOperationComposer {
  export const compose = (props: {
    controllers: INestiaAgentController[];
    config?: INestiaAgentConfig | undefined;
  }): INestiaAgentOperationCollection => {
    const unique: boolean =
      props.controllers.length === 1 ||
      (() => {
        const names: string[] = props.controllers
          .map((controller) =>
            controller.application.functions.map((func) => func.name),
          )
          .flat();
        return new Set(names).size === names.length;
      })();
    const naming = (func: string, ci: number) =>
      unique ? func : `_${ci}_${func}`;

    const array: INestiaAgentOperation[] = props.controllers
      .map((controller, ci) =>
        controller.protocol === "http"
          ? controller.application.functions.map(
              (func) =>
                ({
                  protocol: "http",
                  controller,
                  function: func,
                  name: naming(func.name, ci),
                }) satisfies INestiaAgentOperation.IHttp,
            )
          : controller.application.functions.map(
              (func) =>
                ({
                  protocol: "class",
                  controller,
                  function: func,
                  name: naming(func.name, ci),
                }) satisfies INestiaAgentOperation.IClass,
            ),
      )
      .flat();
    const divided: INestiaAgentOperation[][] | undefined =
      !!props.config?.capacity && array.length > props.config.capacity
        ? divideOperations({
            array,
            capacity: props.config.capacity,
          })
        : undefined;

    const flat: Map<string, INestiaAgentOperation> = new Map();
    const group: Map<string, Map<string, INestiaAgentOperation>> = new Map();
    for (const item of array) {
      flat.set(item.name, item);
      __map_take(group, item.controller.name, () => new Map()).set(
        item.name,
        item,
      );
    }
    return {
      array,
      divided,
      flat,
      group,
    };
  };

  const divideOperations = (props: {
    array: INestiaAgentOperation[];
    capacity: number;
  }): INestiaAgentOperation[][] => {
    const size: number = Math.ceil(props.array.length / props.capacity);
    const capacity: number = Math.ceil(props.array.length / size);
    const replica: INestiaAgentOperation[] = props.array.slice();
    return new Array(size).fill(0).map(() => replica.splice(0, capacity));
  };
}
