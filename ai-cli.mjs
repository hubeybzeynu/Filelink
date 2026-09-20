// FileLink AI CLI - Beautiful command-line interface like Claude
// Shows live streaming, token count, permissions, and execution

import readline from "readline";
import fetch from "node-fetch";

// ANSI colors for beautiful terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

// Configuration
const API_URL = process.env.API_URL || "http://localhost:8081/api/ai";
const SESSION = {
  deviceId: process.env.DEVICE_ID || "cli-session",
  deviceToken: process.env.DEVICE_TOKEN || "cli-token",
};

let conversationHistory = [];
let totalTokens = 0;

// Pretty print functions
function header() {
  console.clear();
  console.log(
    `${colors.cyan}${colors.bright}╔════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}║${colors.reset}            ${colors.magenta}✨ FileLink AI Assistant ✨${colors.reset}                 ${colors.cyan}${colors.bright}║${colors.reset}`
  );
  console.log(
    `${colors.cyan}${colors.bright}╚════════════════════════════════════════════════════════════╝${colors.reset}`
  );
  console.log(
    `${colors.dim}  Powered by Claude • Real-time command execution${colors.reset}\n`
  );
}

function printTokens() {
  console.log(
    `${colors.gray}  Tokens used: ${colors.cyan}${totalTokens.toLocaleString()}${colors.reset} ${colors.gray}• Session: ${conversationHistory.length} messages${colors.reset}\n`
  );
}

function printUser(message) {
  console.log(`${colors.blue}${colors.bright}You:${colors.reset} ${message}\n`);
}

function printThinking() {
  process.stdout.write(`${colors.yellow}${colors.bright}AI:${colors.reset} ${colors.dim}Thinking`);
  const thinkingInterval = setInterval(() => {
    process.stdout.write(".");
  }, 300);
  return thinkingInterval;
}

function stopThinking(interval) {
  clearInterval(interval);
  process.stdout.write("\r" + " ".repeat(80) + "\r");
}

function printAI(content, streaming = false) {
  if (!streaming) {
    console.log(`${colors.yellow}${colors.bright}AI:${colors.reset} ${content}\n`);
  } else {
    process.stdout.write(content);
  }
}

function printExecutionStep(step) {
  console.log(
    `\n${colors.cyan}┌─ Executing: ${colors.bright}${step.tool}${colors.reset}${colors.cyan} ─────────────────────────────────────────┐${colors.reset}`
  );
  console.log(`${colors.cyan}│${colors.reset} Status: ${step.status === "running" ? colors.yellow + "⚙️  Running" : step.status === "completed" ? colors.green + "✅ Completed" : colors.red + "❌ Failed"}${colors.reset}`);

  if (step.output) {
    const lines = step.output.split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(
          `${colors.cyan}│${colors.reset} ${colors.dim}${line.substring(0, 58)}${colors.reset}`
        );
      }
    });
  }

  if (step.error) {
    console.log(`${colors.cyan}│${colors.reset} ${colors.red}Error: ${step.error}${colors.reset}`);
  }

  console.log(
    `${colors.cyan}└────────────────────────────────────────────────────────────┘${colors.reset}\n`
  );
}

function printError(error) {
  console.log(
    `\n${colors.red}${colors.bright}⚠️  Error:${colors.reset} ${colors.red}${error}${colors.reset}\n`
  );
}

function printPermissionRequest(action) {
  console.log(
    `\n${colors.yellow}${colors.bright}⚠️  Permission Required${colors.reset}`
  );
  console.log(`${colors.dim}  Action: ${action}${colors.reset}`);
  console.log(
    `${colors.dim}  This operation requires your approval.${colors.reset}\n`
  );
}

// Main chat function
async function sendMessage(message, deviceId) {
  const thinkingInterval = printThinking();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "chat",
        message,
        session: SESSION,
        conversationHistory,
        selectedDevices: [deviceId],
      }),
    });

    stopThinking(thinkingInterval);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Show execution steps
    if (data.executionSteps && data.executionSteps.length > 0) {
      for (const step of data.executionSteps) {
        printExecutionStep(step);

        // Stream chunks if available
        if (step.chunks && step.chunks.length > 0) {
          console.log(`${colors.dim}Live output:${colors.reset}`);
          for (const chunk of step.chunks) {
            process.stdout.write(colors.dim + chunk + colors.reset);
            await new Promise((r) => setTimeout(r, 20));
          }
          console.log("\n");
        }
      }
    }

    // Stream AI response
    if (data.messages && data.messages.length > 0) {
      const lastMessage = data.messages[data.messages.length - 1];

      if (lastMessage.role === "assistant" && lastMessage.content) {
        process.stdout.write(`${colors.yellow}${colors.bright}AI:${colors.reset} `);

        // Stream word by word
        const words = lastMessage.content.split(" ");
        for (let i = 0; i < words.length; i++) {
          process.stdout.write(words[i] + (i < words.length - 1 ? " " : ""));
          await new Promise((r) => setTimeout(r, 30));
        }
        console.log("\n");
      }

      // Update conversation history
      conversationHistory = data.messages;

      // Estimate tokens (rough)
      totalTokens += Math.ceil(message.length / 4);
      totalTokens += Math.ceil((lastMessage.content?.length || 0) / 4);
    }
  } catch (error) {
    stopThinking(thinkingInterval);
    printError(error.message);

    if (error.message.includes("fetch")) {
      console.log(`${colors.dim}Troubleshooting:${colors.reset}`);
      console.log(`${colors.dim}  1. Is the dev server running? (npm run dev)${colors.reset}`);
      console.log(
        `${colors.dim}  2. Is Omniroute running? (http://localhost:20128)${colors.reset}`
      );
      console.log(`${colors.dim}  3. Check your .env file configuration${colors.reset}\n`);
    }
  }
}

// Interactive CLI
async function startCLI() {
  header();

  // Get available devices
  console.log(`${colors.dim}Fetching connected devices...${colors.reset}\n`);

  try {
    const devicesResponse = await fetch(API_URL.replace("/ai", "/public/link"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "devices",
        ...SESSION,
      }),
    });

    const devicesData = await devicesResponse.json();
    const devices = devicesData.devices || [];

    console.log(`${colors.cyan}${colors.bright}Connected Devices:${colors.reset}`);
    devices.forEach((device, index) => {
      const status = device.online ? colors.green + "● Online" : colors.gray + "○ Offline";
      console.log(
        `  ${colors.bright}${index + 1}.${colors.reset} ${device.name} ${colors.dim}(${device.platform})${colors.reset} ${status}${colors.reset}`
      );
    });

    if (devices.length === 0) {
      console.log(`${colors.red}  No devices connected!${colors.reset}`);
      console.log(
        `${colors.dim}  Start the FileLink agent on your PC first.${colors.reset}\n`
      );
      process.exit(1);
    }

    // Select device
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      `\n${colors.cyan}Select device number (or press Enter for first online):${colors.reset} `,
      async (answer) => {
        const deviceIndex = answer ? parseInt(answer) - 1 : devices.findIndex((d) => d.online);
        const selectedDevice = devices[deviceIndex];

        if (!selectedDevice) {
          console.log(`${colors.red}Invalid device selection!${colors.reset}`);
          process.exit(1);
        }

        console.log(
          `\n${colors.green}Selected:${colors.reset} ${colors.bright}${selectedDevice.name}${colors.reset} ${colors.dim}(${selectedDevice.id})${colors.reset}\n`
        );

        printTokens();

        // Start chat loop
        const chatRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          prompt: `${colors.blue}${colors.bright}You:${colors.reset} `,
        });

        chatRl.prompt();

        chatRl.on("line", async (line) => {
          const message = line.trim();

          if (!message) {
            chatRl.prompt();
            return;
          }

          if (message.toLowerCase() === "exit" || message.toLowerCase() === "quit") {
            console.log(
              `\n${colors.dim}Goodbye! Used ${totalTokens} tokens in this session.${colors.reset}\n`
            );
            process.exit(0);
          }

          if (message.toLowerCase() === "clear") {
            header();
            console.log(
              `${colors.green}Selected:${colors.reset} ${colors.bright}${selectedDevice.name}${colors.reset}\n`
            );
            printTokens();
            chatRl.prompt();
            return;
          }

          console.log(); // Blank line for spacing
          await sendMessage(message, selectedDevice.id);
          printTokens();
          chatRl.prompt();
        });

        console.log(
          `${colors.dim}Commands: 'exit' to quit, 'clear' to clear screen${colors.reset}\n`
        );
      }
    );
  } catch (error) {
    printError("Could not connect to FileLink API");
    console.log(`${colors.dim}Make sure the dev server is running: npm run dev${colors.reset}\n`);
    process.exit(1);
  }
}

// Start the CLI
startCLI();
