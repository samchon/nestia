# MCP (Model Context Protocol) Routes

Nestia provides support for MCP (Model Context Protocol) routes through the `@McpRoute` decorator and `McpController` base class. This allows you to easily expose TypeScript functions as tools that can be called by LLMs (Large Language Models) following the MCP specification.

## Overview

MCP routes in Nestia provide:

- **Type-safe tool definitions** with TypeScript interfaces
- **Automatic JSON schema generation** for tool parameters
- **Built-in MCP protocol handling** for tool discovery and execution
- **Error handling** with proper MCP error responses
- **NestJS integration** following standard patterns

## Basic Usage

### 1. Create an MCP Controller

```typescript
import core from "@nestia/core";

export class WeatherController extends core.McpController("weather") {
  @core.McpRoute({
    name: "get_weather",
    description: "Get current weather for a location",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to get weather for",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "Temperature unit (optional)",
        },
      },
      required: ["location"],
    },
  })
  public async getWeather(params: {
    location: string;
    unit?: "celsius" | "fahrenheit";
  }): Promise<{
    location: string;
    temperature: number;
    unit: string;
    conditions: string;
  }> {
    // Your weather API logic here
    return {
      location: params.location,
      temperature: params.unit === "fahrenheit" ? 72 : 22,
      unit: params.unit || "celsius",
      conditions: "sunny",
    };
  }
}
```

### 2. Register in your Module

```typescript
import { Module } from "@nestjs/common";
import { WeatherController } from "./weather.controller";

@Module({
  controllers: [WeatherController],
})
export class AppModule {}
```

### 3. MCP Protocol Endpoints

The `McpController` automatically provides two endpoints:

- `POST /{prefix}/tools` - Lists all available MCP tools
- `POST /{prefix}/call` - Calls a specific MCP tool

## MCP Protocol

### List Tools Request

```bash
curl -X POST http://localhost:3000/weather/tools \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "inputSchema": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The location to get weather for"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "Temperature unit (optional)"
          }
        },
        "required": ["location"]
      }
    }
  ]
}
```

### Call Tool Request

```bash
curl -X POST http://localhost:3000/weather/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_weather",
    "arguments": {
      "location": "New York",
      "unit": "fahrenheit"
    }
  }'
```

Response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"location\":\"New York\",\"temperature\":72,\"unit\":\"fahrenheit\",\"conditions\":\"sunny\"}"
    }
  ]
}
```

## Error Handling

MCP routes provide comprehensive error handling:

### Tool Not Found (404)
```json
{
  "code": -32601,
  "message": "Tool not found: nonexistent_tool"
}
```

### Invalid Parameters (Tool Error)
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":\"Invalid parameter type\",\"type\":\"Error\"}"
    }
  ],
  "isError": true
}
```

## Advanced Features

### Multiple Tools in One Controller

```typescript
export class CalculatorController extends core.McpController("calc") {
  @core.McpRoute({
    name: "add",
    description: "Add two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  })
  public async add(params: { a: number; b: number }) {
    return { result: params.a + params.b };
  }

  @core.McpRoute({
    name: "multiply",
    description: "Multiply two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  })
  public async multiply(params: { a: number; b: number }) {
    return { result: params.a * params.b };
  }
}
```

### Custom Error Handling

```typescript
@core.McpRoute({
  name: "divide",
  description: "Divide two numbers",
})
public async divide(params: { a: number; b: number }) {
  if (params.b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return { result: params.a / params.b };
}
```

## Best Practices

1. **Provide detailed descriptions** for both tools and parameters
2. **Use JSON Schema validation** in the `inputSchema` property
3. **Handle errors gracefully** with meaningful error messages
4. **Return structured data** that LLMs can easily parse
5. **Use TypeScript interfaces** for type safety

## Integration with LLMs

MCP routes can be used with any LLM that supports the Model Context Protocol:

- OpenAI GPT models (via MCP adapters)
- Anthropic Claude (native MCP support)
- Local LLMs with MCP implementations

The standardized protocol ensures compatibility across different LLM providers.