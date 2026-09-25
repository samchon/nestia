import { ContextId, ContextIdFactory, NestContainer } from "@nestjs/core";
import { ExternalContextCreator } from "@nestjs/core/helpers/external-context-creator";
import { REQUEST_CONTEXT_ID } from "@nestjs/core/router/request/request-constants";

/**
 * The creator of NestJS's enhancer pipeline (guards, interceptors, pipes, and
 * exception filters) for the controllers of one module.
 *
 * `ExternalContextCreator` looks the module up among those providing the class,
 * and a controller is provided by none, so its enhancers would not resolve: the
 * module is named here instead.
 *
 * @internal
 */
export const create_external_context_creator = (
  container: NestContainer,
  moduleKey: string,
): ExternalContextCreator => {
  const creator: ExternalContextCreator =
    ExternalContextCreator.fromContainer(container);
  creator.getContextModuleKey = () => moduleKey;
  return creator;
};

/**
 * The context a request-scoped provider is built in for this request, the one
 * NestJS's router attaches to it, registering the request as `REQUEST`.
 *
 * @internal
 */
export const get_request_context_id = (
  container: NestContainer,
  request: any,
  durable: boolean,
): ContextId => {
  const contextId: ContextId = ContextIdFactory.getByRequest(request);
  if (!request[REQUEST_CONTEXT_ID]) {
    Object.defineProperty(request, REQUEST_CONTEXT_ID, {
      value: contextId,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    container.registerRequestProvider(
      durable ? contextId.payload : Object.assign(request, contextId.payload),
      contextId,
    );
  }
  return contextId;
};
