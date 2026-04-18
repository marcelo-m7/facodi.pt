@echo off
REM FACODI Workspace Setup Script for Windows
cd /d "%~dp0..\.."
call .venv\Scripts\python.exe workspace\odoo\scripts\run_setup.py
pause
