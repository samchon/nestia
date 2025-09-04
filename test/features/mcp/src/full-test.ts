#!/usr/bin/env node

import { NestFactory } from "@nestjs/core";
import { McpTestModule } from "./McpTestModule";

async function testMcpFull() {
  console.log("🚀 Starting comprehensive MCP test...");
  const app = await NestFactory.create(McpTestModule);
  await app.listen(3000);
  
  let testsPassed = 0;
  let testsTotal = 0;

  const test = async (name: string, testFn: () => Promise<void>) => {
    testsTotal++;
    try {
      console.log(`\n🧪 ${name}`);
      await testFn();
      console.log(`✅ PASSED`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : error}`);
    }
  };

  try {
    await test("List tools from both controllers", async () => {
      const toolsResponse = await fetch("http://localhost:3000/tools/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const tools = await toolsResponse.json() as any;
      
      if (tools.tools.length !== 3) {
        throw new Error(`Expected 3 tools, got ${tools.tools.length}`);
      }
      
      console.log(`Found ${tools.tools.length} tools: ${tools.tools.map((t: any) => t.name).join(", ")}`);
    });

    await test("List utility tools", async () => {
      const utilitiesResponse = await fetch("http://localhost:3000/utilities/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const utilities = await utilitiesResponse.json() as any;
      
      if (utilities.tools.length !== 6) {
        throw new Error(`Expected 6 utility tools, got ${utilities.tools.length}`);
      }
      
      console.log(`Found ${utilities.tools.length} utility tools: ${utilities.tools.map((t: any) => t.name).join(", ")}`);
    });

    await test("Weather tool with validation", async () => {
      const response = await fetch("http://localhost:3000/tools/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "get_weather",
          arguments: { location: "Paris", unit: "celsius" },
        }),
      });
      const result = await response.json() as any;
      
      const data = JSON.parse(result.content[0].text);
      if (data.location !== "Paris" || data.unit !== "celsius") {
        throw new Error("Weather data validation failed");
      }
      
      console.log(`Weather for ${data.location}: ${data.temperature}°${data.unit}`);
    });

    await test("Calculator tool", async () => {
      const response = await fetch("http://localhost:3000/tools/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "calculate_sum",
          arguments: { a: 123, b: 456 },
        }),
      });
      const result = await response.json() as any;
      
      const data = JSON.parse(result.content[0].text);
      if (data.result !== 579) {
        throw new Error(`Expected 579, got ${data.result}`);
      }
      
      console.log(`123 + 456 = ${data.result}`);
    });

    await test("UUID generation", async () => {
      const response = await fetch("http://localhost:3000/utilities/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "generate_uuid",
          arguments: {},
        }),
      });
      const result = await response.json() as any;
      
      const data = JSON.parse(result.content[0].text);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      if (!uuidRegex.test(data.uuid)) {
        throw new Error("Invalid UUID format");
      }
      
      console.log(`Generated UUID: ${data.uuid}`);
    });

    await test("Base64 encoding", async () => {
      const testText = "Hello, MCP World! 🌍";
      const response = await fetch("http://localhost:3000/utilities/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "base64_encode",
          arguments: { text: testText },
        }),
      });
      const result = await response.json() as any;
      
      const data = JSON.parse(result.content[0].text);
      const expected = Buffer.from(testText, "utf8").toString("base64");
      if (data.encoded !== expected) {
        throw new Error("Base64 encoding failed");
      }
      
      console.log(`"${testText}" → "${data.encoded}"`);
    });

    await test("JSON validation", async () => {
      const validJson = '{"name": "test", "value": 42}';
      const response = await fetch("http://localhost:3000/utilities/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "validate_json",
          arguments: { json: validJson, format: true },
        }),
      });
      const result = await response.json() as any;
      
      const data = JSON.parse(result.content[0].text);
      if (!data.valid || !data.formatted) {
        throw new Error("JSON validation failed");
      }
      
      console.log(`JSON validation successful, formatted version available`);
    });

    await test("Error handling - invalid tool", async () => {
      const response = await fetch("http://localhost:3000/tools/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "nonexistent_tool",
          arguments: {},
        }),
      });
      
      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }
      
      console.log(`Correctly returned 404 for invalid tool`);
    });

    await test("Error handling - tool exception", async () => {
      const response = await fetch("http://localhost:3000/utilities/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "base64_decode",
          arguments: { encoded: "invalid-base64!" },
        }),
      });
      const result = await response.json() as any;
      
      if (!result.isError) {
        throw new Error("Expected error response");
      }
      
      console.log(`Correctly handled tool exception`);
    });

    console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} passed`);
    
    if (testsPassed === testsTotal) {
      console.log("🎉 All MCP functionality tests passed!");
    } else {
      console.log("⚠️  Some tests failed. Check the output above.");
    }

  } catch (error) {
    console.error("💥 Test suite failed:", error);
  } finally {
    await app.close();
  }
}

testMcpFull().catch(console.error);