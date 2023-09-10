# Nestia
![Nestia Logo](https://nestia.io/logo.png)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Build Status](https://github.com/samchon/nestia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/guide-documents-forestgreen)](https://nestia.io/docs/)

Nestia is a set of helper libraries for NestJS, supporting below features:

  - `@nestia/core`: super-fast decorators
  - `@nestia/sdk`:
    - Swagger generator evolved than ever
    - SDK library generator for clients
    - Mockup Simulator for client applications
    - Automatic E2E test functions generator
  - `@nestia/migrate`: migration from Swagger to NestJS
  - `nestia`: just CLI (command line interface) tool

> **Note**
> 
> - **Only one line** required, with pure TypeScript type
> - Enhance performance **30x** up
>   - Runtime validator is **20,000x faster** than `class-validator`
>   - JSON serialization is **200x faster** than `class-transformer`
> - Software Development Kit
>   - SDK is a collection of `fetch` functions with type definitions like [tRPC](https://trpc.io/)
>   - Mockup simulator means embedded backend simulator in SDK
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
    - [TypedRoute](https://nestia.io/docs/core/TypedRoute/)
    - [TypedBody](https://nestia.io/docs/core/TypedBody/)
    - [TypedParam](https://nestia.io/docs/core/TypedParam/)
    - [TypedQuery](https://nestia.io/docs/core/TypedRoute/)
    - [TypedHeaders](https://nestia.io/docs/core/TypedHeaders/)
    - [TypedException](https://nestia.io/docs/core/TypedException/)
  - Generators
    - [Swagger Documents](https://nestia.io/docs/sdk/swagger/)
    - [SDK Library](https://nestia.io/docs/sdk/sdk/)
    - [E2E Functions](https://nestia.io/docs/sdk/e2e/)
    - [Mockup Simulator](https://nestia.io/docs/sdk/simulator/)
  - [Swagger to NestJS](https://nestia.io/docs/migrate/)

### 🔗 Appendix
  - [⇲ Benchmark Result](https://github.com/samchon/nestia/tree/master/benchmark/results/11th%20Gen%20Intel(R)%20Core(TM)%20i5-1135G7%20%40%202.40GHz)
  - [⇲ `dev.to` Articles](https://dev.to/samchon/series/22751)
