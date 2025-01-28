import { INestiaAgentOperation } from "./INestiaAgentOperation";

/**
 * Collection of operations used in the Nestia Agent.
 *
 * `INestiaAgentOperationCollection` is an interface type representing
 * a collection of operations for several purposes used in the
 * {@link NestiaAgent} internally.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaAgentOperationCollection {
  /**
   * List of every operations.
   */
  array: INestiaAgentOperation[];

  /**
   * Divided operations.
   *
   * If you've configured the {@link INestiaAgentConfig.capacity} property,
   * the  A.I. chatbot ({@link NestiaAgent}) will separate the operations
   * into the several groups to divide and conquer and LLM function selecting
   * for accuracy.
   *
   * In that case, this property `divided`'s length would be dtermined by
   * dividing the number of operations ({@link array}'s length) by the
   * {@link INestiaAgentConfig.capacity}.
   *
   * Otherwise, if the {@link INestiaAgentConfig.capacity} has not been
   * configured, this `divided` property would be the `undefined` value.
   */
  divided?: INestiaAgentOperation[][] | undefined;

  /**
   * Flat dictionary of operations.
   *
   * Dictionary of operations with their {@link INestiaAgentOperation.name}.
   */
  flat: Map<string, INestiaAgentOperation>;

  /**
   * Group dictionary of operations.
   *
   * Dictionary of operations with their
   * {@link INestiaAgentOperation.controller.name} and
   * {@link INestiaAgentOperation.function.name}.
   */
  group: Map<string, Map<string, INestiaAgentOperation>>;
}
