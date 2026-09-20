@echo off
REM FileLink AI - Beautiful CMD Chat Interface
REM Run this after starting the dev server

setlocal

REM Set environment
set ANTHROPIC_BASE_URL=http://localhost:20128
set ANTHROPIC_AUTH_TOKEN=sk-349f10a8a4c70547-e7001a-84b3c82f
set ANTHROPIC_MODEL=Filelink

REM Set API URL
set API_URL=http://localhost:8081/api/ai

REM Run the AI CLI
node ai-cli.mjs
