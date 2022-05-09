# Nestia
Automatic `SDK` and `swagger.json` generator for the NestJS.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/nestia.svg)](https://www.npmjs.com/package/nestia)
[![Downloads](https://img.shields.io/npm/dm/nestia.svg)](https://www.npmjs.com/package/nestia)
[![Build Status](https://github.com/samchon/nestia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)

```bash
# INSTALL NESTIA
npm install --save-dev nestia

# WHEN ALL OF THE CONTROLLRES ARE GATHERED INTO A DIRECTORY
npx nestia sdk "src/controller" --out "src/api"

# REGULAR NESTJS PATTERN
npx nestia sdk "src/**/*.controller.ts" --out "src/api"

# BUILDING SWAGGER.JSON IS ALSO POSSIBLE
npx nestia swagger "src/controller" --out "swagger.json"
```

Don't write any `swagger` comment and DTO decorator. Just run the [nestia](https://github.com/samchon/nestia) up.

  - No swagger comment/decorator
  - No DTO comment/decorator
  - Only pure `interface`s and NestJS code are required
  - [Guide Documents (Wiki)](https://github.com/samchon/nestia/wiki), if you want to know more

When you're developing a backend server using the `NestJS`, you don't need any extra dedication, for delivering the Rest API to the client developers, like writing the `swagger` comments or DTO decorators. 

You just run this [nestia](https://github.com/samchon/nestia) up, then [nestia](https://github.com/samchon/nestia) would generate the SDK automatically, by analyzing your controller classes in the compliation and runtime level. With the automatically generated SDK through this [nestia](https://github.com/samchon/nestia), client developer also does not need any extra work, like reading `swagger` and writing the duplicated interaction code. Client developer only needs to import the SDK and calls matched function with the `await` symbol.

> Even generating the `swagger.json` is also possible. 
>
> When generating the `swagger.json`, use only the pure `interface` types, too.

```typescript
import api from "@samchon/bbs-api";
import { IBbsArticle } from "@samchon/bbs-api/lib/structures/bbs/IBbsArticle";
import { IPage } from "@samchon/bbs-api/lib/structures/common/IPage";

export async function test_article_read(connection: api.IConnection): Promise<void>
{
    // LIST UP ARTICLE SUMMARIES
    const index: IPage<IBbsArticle.ISummary> = await api.functional.bbs.articles.index
    (
        connection,
        "free",
        { limit: 100, page: 1 }
    );

    // READ AN ARTICLE DETAILY
    const article: IBbsArticle = await api.functional.bbs.articles.at
    (
        connection,
        "free",
        index.data[0].id
    );
    console.log(article.title, aritlce.body, article.files);
}
```




## Usage
### Installation
```bash
npm install --save-dev nestia
```

Installing the [nestia](https://github.com/samchon/nestia) is very easy.

Just type the `npm install --save-dev nestia` command in your NestJS backend project.

### SDK generation
```bash
npx nestia sdk <source_controller_directory> --out <output_sdk_directory>

npx nestia sdk "src/**/*.controller.ts" --out "src/api"
npx nestia sdk "src/controllers" --out "src/api"
npx nestia sdk "src/controllers/consumers" "src/controllers/sellers" --out "src/api"
npx nestia sdk "src/controllers" --exclude "src/**/Fake*.ts" --out "src/api"
```

To generate a SDK library through the [nestia](https://github.com/samchon/nestia) is very easy. 

Just type the `nestia sdk <input> --out <output>` command in the console. When there're multiple source directories containing the NestJS controller classes, type all of them separating by a `space` word. If you want to exclude some directories or files from the SDK generation, the `--exclude` option would be useful.

Also, when generating a SDK using the cli options, `compilerOptions` would follow the `tsconfig.json`, that is configured for the backend server. If no `tsconfig.json` file exists in your project, the configuration would be default option (`ES5` with `strict` mode). If you want to use different `compilerOptions` with the `tsconfig.json`, you should configure the [nestia.config.ts](#nestiaconfigts).

### Swagger generation
```bash
npx nestia <source_controller_of_directory> --out <output_path>

npx nestia swagger "src/**/*.controller.ts" --out "./"
npx nestia swagger "src/controllers" --out "./swagger.json"
npx nestia swagger "src/consumers" "src/sellers" --out "actors.json"
npx nestia swagger "src/controllers" --exclude "src/**/Fake*.ts" -out "./" 
```

The [nestia](https://github.com/samchon/nestia) even supports the `swagger.json` generation and it's also extermely easy.

Jsut type the `nestia swagger <input> --out <output>` command in the console. When there're multiple source directories containing the NestJS controller classes, type all of them separating by a `space` word. If you want to exclude some directories or files from the `swagger.json` generation, the `--exclude` option would be useful.

Also, when generating a SDK using the cli options, `compilerOptions` would follow the `tsconfig.json`, that is configured for the backend server. If no `tsconfig.json` file exists in your project, the configuration would be default option (`ES5` with `strict` mode). If you want to use different `compilerOptions` with the `tsconfig.json`, you should configure the [nestia.config.ts](#nestiaconfigts).

### Dependencies
```bash
npx nestia install
```

SDK library generated by the [nestia](https://github.com/samchon/nestia) requires the [nestia-fetcher](https://github.com/samchon/nestia-fetcher) module. Also, the [typescript-is](https://github.com/woutervh-/typescript-is) and [typescript-json](https://github.com/samchon/typescript-json) modules can be required following your [nestia.config.ts](#nestiaconfigts) options.

The `npx nestia install` command installs those dependencies with `package.json` configuration.

```json
{
  "name": "payments-server-api",
  "dependencies": {
    "nestia-fetcher": "^2.0.1",
    "typescript-is": "^0.19.0",
    "typescript-json": "^2.0.9"
  }
}
```



## Advanced
### `nestia.config.ts`
```typescript
/**
 * Definition for the `nestia.config.ts` file.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IConfiguration
{
    /**
     * List of files or directories containing the NestJS controller classes.
     */
    input: string | string[] | IConfiguration.IInput;

    /**
     * Output directory that SDK would be placed in.
     */
    output?: string;

    /**
     * Compiler options for the TypeScript.
     * 
     * If omitted, the configuration would follow the `tsconfig.json`.
     */
    compilerOptions?: ts.CompilerOptions;

    /**
     * Whether to assert parameter types or not.
     * 
     * If you configure this option to be `true`, all of the function parameters would be
     * checked through the [typescript-is](https://github.com/woutervh-/typescript-is).
     */
    assert?: boolean;

    /**
     * Whether to optimize JSON string conversion 2x faster or not.
     * 
     * If you configure this option to be `true`, the SDK library would utilize the
     * [typescript-json](https://github.com/samchon/typescript-json) and the JSON string
     * conversion speed really be 2x faster.
     */
    json?: boolean;

    /**
     * Building `swagger.json` is also possible.
     */
    swagger?: IConfiguration.ISwagger;
}
export namespace IConfiguration
{
    /**
     * List of files or directories to include or exclude to specifying the NestJS 
     * controllers.
     */
    export interface IInput
    {
        /**
         * List of files or directories containing the NestJS controller classes.
         */
        include: string[];

        /**
         * List of files or directories to be excluded.
         */
        exclude?: string[];
    }

    /**
     * Building `swagger.json` is also possible.
     */
    export interface ISwagger
    {
        /**
         * Output path of the `swagger.json`.
         * 
         * If you've configure only directory, the file name would be `swagger.json`. 
         * Otherwise you configure file name and extension, the `swagger.json` file would
         * be renamed to what you've configured.
         */
        output: string;
    }
}
```

Instead of specifying `input` and `output` directories using the cli options, you can specify those directories as an independent configuration file. It's the `nestia.config.ts` and with the `nestia.config.ts` file, you also configure independent TypeScript compiler option from the `tsconfig.json`.

Write below content as the `nestia.config.ts` file and place it onto the root directory of your backend project. After the configuration, you can generate the SDK only with the `npx nestia sdk` command, without any directory specification. 

```typescript
import type nestia from "nestia";

const config: nestia.IConfiguration = {
    input: "src/controllers",
    output: "src/api",
    assert: false
};
export default config;
```

> Alternative options for the regular NestJS project:
> 
> ```typescript
> export = {
>     input: "src/**/*.controller.ts",
>     /* input: {
>         include: ["src/controllers/**\/*.controller.ts"],
>         exclude: ["src/controllers/**\/fake_*.controller.ts"]
>     },*/
>     output: "src/api",
>     assert: true
> }
> ```



### Recommended Structures
When developing a NestJS backend server with this [nestia](https://github.com/samchon/nestia), I recommend you to follow below directory structure. The key princinple of below structure is to gathering all of the DTO interface structures into the `src/api/structures` directory and gather all of the controller classes into the `src/controllers` directory.

If you place the SDK onto the `src/api` directory and gather all of the DTO interface structures into the `src/api/structures` directory, you can publish the SDK library very easily without any special configuration. Also when you're develop the test automation program, you can implement the API testing features very convenienty through the automatically generated SDK through this [nestia](https://github.com/samchon/nestia).

  - src
    - api
      - **functional**: automatically generated SDK functions
      - **structures**: DTO structures
    - controllers
    - providers
    - models
    - **test**: Test automation program using SDK functions
  - package.json
  - tsconfig.json
  - nestia.config.ts

For your deep understanding about this directory structure with this [nestia](https://github.com/samchon/nestia), I've prepared an example backend project. Looking around the example repository and reading the [README.md](https://github.com/samchon/backend#13-directories) of it, you can feel that such directory structure is how convenient for SDK publishing and test automation program implementation.

  - https://github.com/samchon/backend




## Demonstration
To demonstrate which SDK codes would be generated by this [nestia](https://github.com/samchon/nestia):

  - Representative files
    - [DTO interface used in the RestAPI](https://github.com/samchon/nestia/tree/master/demo/simple/src/api/structures/ISaleArticleComment.ts)
    - [Controllers of the NestJS](https://github.com/samchon/nestia/tree/master/demo/simple/src/controllers/ConsumerSaleArticleCommentsController.ts)
    - [SDK generated by this **nestia**](https://github.com/samchon/nestia/tree/master/demo/simple/src/api/functional/consumers/sales/articles/comments/index.ts)
    - [`swagger.json` generated by this **nestia**](https://github.com/samchon/nestia/tree/master/demo/simple/swagger.json)
  - Demonstration Projects
    - [encrypt](https://github.com/samchon/nestia/tree/master/demo/encrypt): Request and response body are fully encrypted
    - [generic](https://github.com/samchon/nestia/tree/master/demo/generic): Generic typed controller classes
    - [recursive](https://github.com/samchon/nestia/tree/master/demo/recursive): Recursive DTO interface, [swagger editor](https://editor.swagger.io) can't expresss it
    - [simple](https://github.com/samchon/nestia/tree/master/demo/simple): Simple DTO interface and controller class
    - [union](https://github.com/samchon/nestia/tree/master/demo/union): Only [nestia](https://github.com/samchon/nestia) can handle the union typed DTO interface

### DTO
Using pure interface type as DTO is possible.

You dont' need to define any extra comment or decorator function to make the DTO (Data Transfer Object). Just define the DTO as a pure interface structure, then [nestia](https://github.com/samchon/nestia) will do everything instead of you. 

If you're afraiding because your type is union or intersection, I can say that it does not matter. Even when generic or conditional type comes, it does not matter. Just enjoy the pure TypeScript type.

```typescript
/**
 * Comment wrote on a sale related article.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleComment
{
    /**
     * Primary Key.
     */
    id: number;

    /**
     * Type of the writer.
     */
    writer_type: "seller" | "consumer";

    /**
     * Name of the writer.
     */
    writer_name: string;

    /**
     * Contents of the comments.
     * 
     * When the comment writer tries to modify content, it would not modify the comment
     * content but would be accumulated. Therefore, all of the people can read how
     * the content has been changed.
     */
    contents: ISaleComment.IContent[];

    /**
     * Creation time.
     */
    created_at: string;
}

export namespace ISaleComment
{
    /**
     * Store info.
     */
    export interface IStore
    {
        /**
         * Body of the content.
         */
        body: string;
    }

    /**
     * Content info.
     */
    export interface IContent extends IStore
    {
        /**
         * Creation time.
         */
        created_at: string;
    }
}
```

### Controller
If you've decided to adapt this [nestia](https://github.com/samchon/nestia) and you want to generate the SDK directly, you don't need any extra work. Just keep you controller class down and do noting. The only one exceptional case that you need an extra dedication is, when you want to explain about the API function to the client developers through the comments.

```typescript
@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController
{
    /**
     * Store a new question.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param input Content to archive
     * 
     * @return Newly archived question
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     */
    @nest.Post()
    public store
        (
            @nest.Request() request: express.Request,
            @nest.Param("section") section: string, 
            @nest.Param("saleId") saleId: number, 
            @nest.Body() input: ISaleQuestion.IStore
        ): Promise<ISaleQuestion>;
}
```

### SDK
When you run the [nestia](https://github.com/samchon/nestia) up using the upper controller class `ConsumerSaleQuestionsController`, the [nestia](https://github.com/samchon/nestia) would generate below function for the client developers, by analyzing the `ConsumerSaleQuestionsController` class in the compilation and runtime level.

As you can see, the comments from the `ConsumerSaleQuestionsController.store()` are fully copied to the SDK function. Therefore, if you want to deliver detailed description about the API function, writing the detailed comment would be tne best choice.

```typescript
/**
 * Store a new question.
 * 
 * @param connection connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param request Instance of the Express.Request
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param input Content to archive
 * @return Newly archived question
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 401 unauthorized error when you've not logged in yet
 * 
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 * @controller ConsumerSaleQuestionsController.store()
 * @path POST /consumers/:section/sales/:saleId/questions/
 */
export function store
    (
        connection: IConnection,
        section: string,
        saleId: number,
        input: Primitive<store.Input>
    ): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        store.ENCRYPTED,
        store.METHOD,
        store.path(section, saleId),
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleInquiry.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;

    export const METHOD = "POST" as const;
    export const PATH: string = "/consumers/:section/sales/:saleId/questions";
    export const ENCRYPTED: Fetcher.IEncrypted = {
        request: true,
        response: true,
    };

    export function path(section: string, saleId: number): string
    {
        return `/consumers/${section}/sales/${saleId}/questions`;
    }
}
```

### `swagger.json`
Even the `swagger.json` generation does not require any swagger comment and DTO decorator.

The [nestia](https://github.com/samchon/nestia) will generate the perfect `swagger.json` automatically, by analyzing your source code (DTO interface and controller class) in the compilation and runtime level. Furthermore, your descriptive comments would be automatically assigned into the adequate `description` property in the `swagger.json`.

```json
{
  "paths": {
    "/consumers/{section}/sales/{saleId}/comments/{articleId}": {
      "post": {
        "tags": [],
        "parameters": [
          {
            "name": "section",
            "in": "path",
            "description": "Code of the target section",
            "schema": {
              "type": "string",
              "nullable": false
            },
            "required": true
          },
          {
            "name": "saleId",
            "in": "path",
            "description": "ID of the target sale",
            "schema": {
              "type": "number",
              "nullable": false
            },
            "required": true
          },
          {
            "name": "articleId",
            "in": "path",
            "description": "ID of the target article",
            "schema": {
              "type": "number",
              "nullable": false
            },
            "required": true
          }
        ],
        "requestBody": {
          "description": "Content to write",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ISaleComment.IStore"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Newly archived comment",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ISaleComment"
                }
              }
            }
          },
          "400": {
            "description": "bad request error when type of the input data is not valid"
          },
          "401": {
            "description": "unauthorized error when you've not logged in yet"
          },
          "403": {
            "description": "forbidden error when you're a seller and the sale is not yours"
          },
          "404": {
            "description": "not found error when unable to find the matched record"
          }
        },
        "description": "Store a new comment."
      }
    }
  },
  "components": {
    "schemas": {
      "ISaleComment": {
        "type": "object",
        "properties": {
          "id": {
            "description": "Primary Key.",
            "type": "number",
            "nullable": false
          },
          "writer_type": {
            "description": "Type of the writer.",
            "type": "string",
            "nullable": false
          },
          "writer_name": {
            "description": "Name of the writer.",
            "type": "string",
            "nullable": false
          },
          "contents": {
            "description": "Contents of the comments.\n\nWhen the comment writer tries to modify content, it would not modify the comment\ncontent but would be accumulated. Therefore, all of the people can read how\nthe content has been changed.",
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ISaleComment.IContent"
            },
            "nullable": false
          },
          "created_at": {
            "description": "Creation time.",
            "type": "string",
            "nullable": false
          }
        },
        "nullable": false,
        "required": [
          "id",
          "writer_type",
          "writer_name",
          "contents",
          "created_at"
        ],
        "description": "Comment wrote on an article."
      },
      "ISaleComment.IContent": {
        "type": "object",
        "properties": {
          "created_at": {
            "description": "Creation time.",
            "type": "string",
            "nullable": false
          },
          "body": {
            "description": "Body of the content.",
            "type": "string",
            "nullable": false
          }
        },
        "nullable": false,
        "required": [
          "created_at",
          "body"
        ],
        "description": "Content info."
      },
      "ISaleComment.IStore": {
        "type": "object",
        "properties": {
          "body": {
            "description": "Body of the content.",
            "type": "string",
            "nullable": false
          }
        },
        "nullable": false,
        "required": [
          "body"
        ],
        "description": "Store info."
      }
    }
  }
}
```





## Appendix
### Template Project
https://github.com/samchon/backend

I support template backend project using this [nestia](https://github.com/samchon/nestia) library, [backend](https://github.com/samchon/backend).

Reading the README content of the [backend](https://github.com/samchon/backend) template repository, you can find lots of example backend projects who've been generated from the [backend](https://github.com/samchon/backend). Furthermore, those example projects guide how to generate SDK library from the [nestia](https://github.com/samchon/nestia) and how to distribute the SDK library thorugh the NPM module.

Therefore, if you're planning to compose your own backend project using this [nestia](https://github.com/samchon/nestia), I recommend you to create the repository and learn from the [backend](https://github.com/samchon/backend) template project.

### Nestia-Helper
https://github.com/samchon/nestia-helper

Helper library of the `NestJS` with [nestia](https://github.com/samchon/nestia).

[nestia-helper](https://github.com/samchon/nestia-helper) is a type of helper library for `Nestia` by enhancing decorator functions. Also, all of the decorator functions provided by this [nestia-helper](https://github.com/samchon/nestia-helper) are all fully compatible with the [nestia](https://github.com/samchon/nestia), who can generate SDK library by analyzing NestJS controller classes in the compilation level.

Of course, this [nestia-helper](https://github.com/samchon/nestia-helper) is not essential for utilizing the `NestJS` and [nestia](https://github.com/samchon/nestia). You can generate SDK library of your NestJS developed backend server without this [nestia-helper](https://github.com/samchon/nestia-helper). However, as decorator functions of this [nestia-helper](https://github.com/samchon/nestia-helper) is enough strong, I recommend you to adapt this [nestia-helper](https://github.com/samchon/nestia-helper) when using `NestJS` and [nestia](https://github.com/samchon/nestia).

  - Supported decorator functions
    - [EncryptedController](https://github.com/samchon/nestia-helper#encryptedcontroller), [EncryptedModule](https://github.com/samchon/nestia-helper#encryptedmodule)
    - [TypedRoute](https://github.com/samchon/nestia-helper#typedroute), [EncryptedRoute](https://github.com/samchon/nestia-helper#encryptedroute)
    - [TypedParam](https://github.com/samchon/nestia-helper#typedparam), [EncryptedBody](https://github.com/samchon/nestia-helper#encryptedbody), [PlainBody](https://github.com/samchon/nestia-helper#plainbody)
    - [ExceptionManager](https://github.com/samchon/nestia-helper#exceptionmanager)

### Safe-TypeORM
https://github.com/samchon/safe-typeorm

[safe-typeorm](https://github.com/samchon/safe-typeorm) is another library that what I've developed, helping `TypeORM` in the compilation level and optimizes DB performance automatically without any extra dedication.

Therefore, this [nestia](https://github.com/samchon/nestia) makes you to be much convenient in the API interaction level and safe-typeorm helps you to be much convenient in the DB interaction level. With those [nestia](https://github.com/samchon/nestia) and [safe-typeorm](https://github.com/samchon/safe-typeorm), let's implement the backend server much easily and conveniently.

  - When writing [**SQL query**](https://github.com/samchon/safe-typeorm#safe-query-builder),
    - Errors would be detected in the **compilation** level
    - **Auto Completion** would be provided
    - **Type Hint** would be supported
  - You can implement [**App-join**](https://github.com/samchon/safe-typeorm#app-join-builder) very conveniently
  - When [**SELECT**ing for **JSON** conversion](https://github.com/samchon/safe-typeorm#json-select-builder)
    - [**App-Join**](https://github.com/samchon/safe-typeorm#app-join-builder) with the related entities would be automatically done
    - Exact JSON **type** would be automatically **deduced**
    - The **performance** would be **automatically tuned**
  - When [**INSERT**](https://github.com/samchon/safe-typeorm#insert-collection)ing records
    - Sequence of tables would be automatically sorted by analyzing dependencies
    - The **performance** would be **automatically tuned**

![Safe-TypeORM Demo](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demo/safe-query-builder.gif)

### Archidraw
https://www.archisketch.com/

I have special thanks to the Archidraw, where I'm working for.

The Archidraw is a great IT company developing 3D interior editor and lots of solutions based on the 3D assets. Also, the Archidraw is the first company who had adopted this [nestia](https://github.com/samchon/nestia) on their commercial backend project, even this [nestia](https://github.com/samchon/nestia) was in the alpha level.