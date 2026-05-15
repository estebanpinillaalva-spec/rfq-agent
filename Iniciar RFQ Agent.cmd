@echo off
title RFQ Agent Gestor
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\iniciar-app.ps1"
