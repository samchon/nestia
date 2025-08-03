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

    // Test 2: Call weather tool with celsius
    console.log("\n=== Testing weather tool (celsius) ===");
    const weatherCelsiusResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "get_weather",
        arguments: {
          location: "Tokyo",
        },
      }),
    });
    const weatherCelsiusResult = await weatherCelsiusResponse.json();
    console.log("Weather result (celsius):", JSON.stringify(weatherCelsiusResult, null, 2));

    // Test 3: Call weather tool with fahrenheit
    console.log("\n=== Testing weather tool (fahrenheit) ===");
    const weatherFahrenheitResponse = await fetch("http://localhost:3000/tools/call", {
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
    const weatherFahrenheitResult = await weatherFahrenheitResponse.json();
    console.log("Weather result (fahrenheit):", JSON.stringify(weatherFahrenheitResult, null, 2));

    // Test 4: Call calculator tool
    console.log("\n=== Testing calculator tool ===");
    const calcResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "calculate_sum",
        arguments: {
          a: 15,
          b: 27,
        },
      }),
    });
    const calcResult = await calcResponse.json();
    console.log("Calculation result:", JSON.stringify(calcResult, null, 2));

    // Test 5: Call time tool
    console.log("\n=== Testing time tool ===");
    const timeResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "get_time",
        arguments: {},
      }),
    });
    const timeResult = await timeResponse.json();
    console.log("Time result:", JSON.stringify(timeResult, null, 2));

    // Test 6: Error handling - invalid tool
    console.log("\n=== Testing error handling (invalid tool) ===");
    const invalidToolResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "nonexistent_tool",
        arguments: {},
      }),
    });
    console.log("Invalid tool status:", invalidToolResponse.status);
    const invalidToolResult = await invalidToolResponse.json();
    console.log("Invalid tool result:", JSON.stringify(invalidToolResult, null, 2));

    // Test 7: Error handling - invalid parameters
    console.log("\n=== Testing error handling (invalid parameters) ===");
    const invalidParamsResponse = await fetch("http://localhost:3000/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "calculate_sum",
        arguments: {
          a: "not a number",
          b: 5,
        },
      }),
    });
    const invalidParamsResult = await invalidParamsResponse.json();
    console.log("Invalid params result:", JSON.stringify(invalidParamsResult, null, 2));

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await app.close();
  }
}

testMcp().catch(console.error);