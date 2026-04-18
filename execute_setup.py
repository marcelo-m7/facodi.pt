#!/usr/bin/env python3
"""
Wrapper script that runs facodi_setup_final.py and saves complete output to file.
This ensures we can capture and verify the setup results.
"""
import subprocess
import sys
import json
from pathlib import Path

script_dir = Path(__file__).parent / "workspace" / "odoo" / "scripts"
setup_script = script_dir / "facodi_setup_final.py"
results_file = script_dir / "FACODI_SETUP_RESULT.json"
output_log = script_dir / "setup_execution.log"

print(f"Setting working directory to project root...")
import os
os.chdir(Path(__file__).parent)

print(f"Executing: {setup_script}")
print(f"Output will be saved to: {output_log}")
print()

# Run the setup script and capture output
try:
    result = subprocess.run(
        [sys.executable, str(setup_script)],
        capture_output=True,
        text=True,
        timeout=120
    )
    
    # Save output
    with open(output_log, "w", encoding="utf-8") as f:
        f.write("STDOUT:\n")
        f.write(result.stdout)
        f.write("\n\nSTDERR:\n")
        f.write(result.stderr)
        f.write(f"\n\nReturn Code: {result.returncode}")
    
    # Print output
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr, file=sys.stderr)
    
    # Check results
    if results_file.exists():
        print(f"\n✓ Results file created: {results_file}")
        with open(results_file) as f:
            results = json.load(f)
        print("\nResults summary:")
        print(json.dumps(results, indent=2))
    else:
        print(f"\n✗ Results file NOT found at: {results_file}")
    
    print(f"\n✓ Complete log saved to: {output_log}")
    
except subprocess.TimeoutExpired:
    print(f"✗ Script timed out after 120 seconds")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
