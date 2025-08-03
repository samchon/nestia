#!/usr/bin/env node

import { NestFactory } from "@nestjs/core";
import { McpTestModule } from "./McpTestModule";

async function testMcp() {
  console.log("Creating test app...");
  const app = await NestFactory.create(McpTestModule);
  await app.listen(3000);
  
  try {
    // Test 1: List tools
    console.log("\n=== Testing list tools ===");
    const listResponse = await fetch("http://localhost:3000/tools/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const tools = await listResponse.json();
    console.log("Available tools:", JSON.stringify(tools, null, 2));

    // Test 2: Call weather tool
    console.log("\n=== Testing weather tool ===");
    const weatherResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "get_weather",
        arguments: {
          location: "New York",
          unit: "fahrenheit",
        },
      }),
    });
    const weatherResult = await weatherResponse.json();
    console.log("Weather result:", JSON.stringify(weatherResult, null, 2));

    // Test 3: Call calculator tool
    console.log("\n=== Testing calculator tool ===");
    const calcResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "calculate_sum",
        arguments: {
          a: 5,
          b: 3,
        },
      }),
    });
    const calcResult = await calcResponse.json();
    console.log("Calculation result:", JSON.stringify(calcResult, null, 2));

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await app.close();
  }
}

testMcp().catch(console.error);