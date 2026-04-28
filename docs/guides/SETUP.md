# Codoo v1.0 Setup Guide

## One-Command Setup (Docker)

```bash
# Clone & initialize
git clone https://github.com/Corvanis/Codoo
cd Codoo
git submodule update --init --recursive

# Copy environment
cp .env.example .env
# Edit .env and set ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD

# Build Docker image
docker-compose build

# Start development container
docker-compose run codoo /bin/bash
```

Inside the container:

```bash
# Run CLI
python -m codoo --help

# List available tasks
codoo task list

# Run a task
codoo task run --name import-products --mode inspect

# View evidence logs
codoo evidence list
```

---

## Manual Setup (Python venv)

If you prefer not to use Docker:

```bash
# Create virtual environment
python -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .

# Configure credentials
cp .env.example .env
# Edit .env

# Run CLI
python -m codoo --help
```

---

## Configuration

### `.env` File

Create `.env` from `.env.example`:

```bash
# Odoo Connection (REQUIRED)
ODOO_HOST=https://marcorv.odoo.com
ODOO_DB=fame_production
ODOO_USERNAME=your_username@example.com
ODOO_PASSWORD=your_app_specific_password  # For SaaS with 2FA

# Optional
LOG_LEVEL=INFO
EVIDENCE_DIR=docs/logs
DATA_DIR=workspace/data
```

### Odoo SaaS (2FA)

If your Odoo SaaS instance has 2FA enabled:

1. Go to Account Settings → Security
2. Generate **App-Specific Password**
3. Use that password in `ODOO_PASSWORD=`

---

## Testing Your Setup

```bash
# Check Python version (must be 3.13+)
python --version

# Check dependencies installed
python -c "import pydantic; import typer; print('✓ Core deps OK')"

# Validate configuration
python -c "from codoo.config import load_config; c = load_config(); print(f'✓ Config loaded: {c.odoo_db}')"

# Test CLI
python -m codoo --help
```

---

## Running Tasks

### Inspect Mode (Diagnostics)
```bash
codoo task run --name import-products --mode inspect
# Output: docs/logs/productimporttask_inspect_20260427T163045Z.json
```

### Dry-Run Mode (Preview)
```bash
codoo task run --name import-products --mode dry-run
# Shows what would change WITHOUT making changes
```

### Apply Mode (Execute)
```bash
codoo task run --name import-products --mode apply
# Makes actual changes to Odoo
```

### Verify Mode (Validate)
```bash
codoo task run --name import-products --mode verify
# Checks that changes were applied correctly
```

---

## Viewing Evidence Logs

```bash
# List all evidence logs
codoo evidence list

# Filter by task
codoo evidence list --task import-products

# Display a specific log
codoo evidence show --file docs/logs/productimporttask_apply_20260427T163045Z.json
```

---

## Troubleshooting

### "Cannot connect to Odoo"
- Check `ODOO_HOST` is correct and accessible
- Verify `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD` are set

### "Authentication failed"
- For SaaS with 2FA: use app-specific password (not your login password)
- Check credentials in `.env`

### "ModuleNotFoundError: No module named 'codoo'"
```bash
# Install in development mode
pip install -e .
```

### "pytest: command not found"
```bash
# Install test dependencies
pip install -e ".[dev]"
pytest tests/
```

---

## Development Workflow

### Running Tests
```bash
# All tests
pytest tests/

# With coverage
pytest tests/ --cov=src/codoo

# Specific test file
pytest tests/unit/test_models.py -v
```

### Type Checking
```bash
# Strict type checking
mypy --strict src/codoo/
```

### Code Formatting
```bash
# Format code
black src/codoo/ tests/

# Check formatting
ruff check src/codoo/
```

---

## Docker Tips

### Mount volumes for live code editing
```bash
docker-compose run -v $(pwd):/app codoo /bin/bash
```

### Run commands directly
```bash
docker-compose run codoo python -m codoo task list
docker-compose run codoo pytest tests/
```

### Rebuild after installing new dependencies
```bash
docker-compose build --no-cache
```

---

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design & module reference
- [MIGRATION.md](MIGRATION.md) — Converting legacy scripts to Tasks
