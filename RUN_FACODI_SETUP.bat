::  FACODI Workspace Setup - Windows Batch Script
@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo FACODI Odoo Workspace Setup
echo ========================================
echo.

echo Running setup script...
.venv\Scripts\python.exe workspace\odoo\scripts\facodi_setup_final.py

echo.
echo Setup complete. Checking results file...
timeout /t 2 /nobreak

if exist "workspace\odoo\scripts\FACODI_SETUP_RESULT.json" (
    echo.
    echo Results file found at: workspace\odoo\scripts\FACODI_SETUP_RESULT.json
    echo.
    echo Contents:
    type workspace\odoo\scripts\FACODI_SETUP_RESULT.json
) else (
    echo WARNING: Results file not found
)

echo.
echo.
pause
