# Nestia
![Nestia Logo](https://nestia.io/logo.png)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/fetcher.svg)](https://www.npmjs.com/package/@nestia/fetcher)
[![Downloads](https://img.shields.io/npm/dm/@nestia/fetcher.svg)](https://www.npmjs.com/package/@nestia/fetcher)
[![Build Status](https://github.com/samchon/nestia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/Guide-Documents-forestgreen)](https://nestia.io/docs/)
[![Gurubase](https://img.shields.io/badge/Gurubase-Document%20Chatbot-006BFF)](https://gurubase.io/g/nestia)
[![Discord Badge](https://img.shields.io/badge/discord-samchon-d91965?style=flat&labelColor=5866f2&logo=discord&logoColor=white&link=https://discord.gg/E94XhzrUCZ)](https://discord.gg/E94XhzrUCZ)

Nestia is a set of helper libraries for NestJS, supporting below features:

  - `@nestia/core`:
    - Super-fast/easy decorators
    - Advanced WebSocket routes
  - `@nestia/sdk`:
    - Swagger generator, more evolved than ever
    - SDK library generator for clients
    - Mockup Simulator for client applications
    - Automatic E2E test functions generator
  - `@nestia/e2e`: Test program utilizing e2e test functions
  - `@nestia/benchmark`: Benchmark program using e2e test functions
  - `@nestia/editor`: Swagger-UI with Online TypeScript Editor
  - `@agentica`: Agentic AI library specialized in LLM function calling
  - `nestia`: Just CLI (command line interface) tool

> [!NOTE]
> 
> - **Only one line** required, with pure TypeScript type
> - Enhance performance **30x** up
>   - Runtime validator is **20,000x faster** than `class-validator`
>   - JSON serialization is **200x faster** than `class-transformer`
> - Software Development Kit
>   - Collection of typed `fetch` functions with DTO structures like [tRPC](https://trpc.io/)
>   - Mockup simulator means embedded backend simulator in the SDK
>     - similar with [msw](https://mswjs.io/), but fully automated

![nestia-sdk-demo](https://user-images.githubusercontent.com/13158709/215004990-368c589d-7101-404e-b81b-fbc936382f05.gif)

> Left is NestJS server code, and right is client (frontend) code utilizing SDK




## Sponsors and Backers
Thanks for your support.

Your donation would encourage `nestia` development.

[![Backers](https://opencollective.com/nestia/backers.svg?avatarHeight=75&width=600)](https://opencollective.com/nestia)




## Guide Documents
Check out the document in the [website](https://nestia.io/docs/):

### 🏠 Home
  - [Introduction](https://nestia.io/docs/)
  - [Setup](https://nestia.io/docs/setup/)
  - [Pure TypeScript](https://nestia.io/docs/pure)

### 📖 Features
  - Core Library
    - [`@WebSocketRoute`](https://nestia.io/docs/core/WebSocketRoute)
    - [`@TypedRoute`](https://nestia.io/docs/core/TypedRoute/)
    - [**`@TypedBody`**](https://nestia.io/docs/core/TypedBody/)
    - [`@TypedParam`](https://nestia.io/docs/core/TypedParam/)
    - [`@TypedQuery`](https://nestia.io/docs/core/TypedQuery/)
    - [`@TypedFormData`](https://nestia.io/docs/core/TypedFormData/)
    - [`@TypedHeaders`](https://nestia.io/docs/core/TypedHeaders/)
    - [`@TypedException`](https://nestia.io/docs/core/TypedException/)
  - Software Development Kit
    - [SDK Builder](https://nestia.io/docs/sdk/)
    - [Mockup Simulator](https://nestia.io/docs/sdk/simulate/)
    - [E2E Test Functions](https://nestia.io/docs/sdk/e2e/)
    - [Distribution](https://nestia.io/docs/sdk/distribute/)
  - Swagger Document
    - [Swagger Builder](https://nestia.io/docs/swagger/)
    - [**AI Chatbot Development**](https://nestia.io/docs/swagger/chat/)
    - [Cloud Swagger Editor](https://nestia.io/docs/swagger/editor/)
    - [Documentation Strategy](https://nestia.io/docs/swagger/strategy/)
  - E2E Testing
    - [Why E2E Test?](https://nestia.io/docs/e2e/why/)
    - [Test Program Development](https://nestia.io/docs/e2e/development/)
    - [Performance Benchmark](https://nestia.io/docs/e2e/benchmark/)

### 🔗 Appendix
  - [API Documents](https://nestia.io/api)
  - [⇲ Benchmark Result](https://github.com/samchon/nestia/tree/master/benchmark/results/11th%20Gen%20Intel(R)%20Core(TM)%20i5-1135G7%20%40%202.40GHz)
  - [⇲ `dev.to` Articles](https://dev.to/samchon/series/22751)
