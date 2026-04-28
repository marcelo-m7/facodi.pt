# Migration Guide: Legacy Scripts → v1.0 Tasks

This guide helps you convert legacy `workspace/scripts/*.py` scripts to the new v1.0 Task system.

## Quick Comparison

| Aspect | v0.5 (Legacy) | v1.0 (Tasks) |
|--------|---------------|------------|
| File location | `workspace/scripts/import_products.py` | `src/codoo/tasks/products/import_task.py` |
| Class structure | Ad-hoc functions | Inherits from `Task` base class |
| Execution modes | Script arguments | Deterministic: inspect → dry-run → apply → verify |
| Logging | Ad-hoc print() | Async + JSON evidence |
| Type hints | None | Full (mypy) |
| Testing | None | pytest fixtures |

## Step-by-Step Conversion

### Step 1: Identify the Script

Example legacy script:
```python
# workspace/scripts/import_products.py (v0.5)

import sys
from workspace.adapters.odoo import OdooXMLRPCClient
from workspace.core.product_transformations import transform_products

def main():
    client = OdooXMLRPCClient(...)
    products = transform_products(...)
    for product in products:
        client.create("product.product", product)
    print(f"✓ Imported {len(products)} products")

if __name__ == "__main__":
    main()
```

### Step 2: Create Task Class

Create `src/codoo/tasks/products/import_task.py`:

```python
from typing import Any
from codoo.tasks.base import Task
from codoo.odoo.client import AsyncOdooClient

class ProductImportTask(Task):
    """Import products from prepared data files."""

    async def _inspect(self) -> dict[str, Any]:
        """Diagnose product data source."""
        # 1. Read data files
        # 2. Count products
        # 3. Check for duplicates
        return {
            "mode": "inspect",
            "products_found": 100,
            "duplicates": 5,
            "ready_to_import": True,
        }

    async def _dry_run(self) -> dict[str, Any]:
        """Show what would be imported (no mutations)."""
        # 1. Validate each product
        # 2. Check Odoo state (existing products)
        # 3. Simulate import
        return {
            "mode": "dry-run",
            "products_to_create": 100,
            "products_to_update": 5,
            "estimated_duration_sec": 30,
        }

    async def _apply(self) -> dict[str, Any]:
        """Execute import (mutate Odoo data)."""
        # 1. Create/update products in Odoo
        # 2. Track changes
        # 3. Handle errors gracefully
        if self.client:
            for product in self.products:
                product_id = await self.client.create("product.product", product)
                # Track success
        
        return {
            "mode": "apply",
            "products_imported": 100,
            "errors": [],
        }

    async def _verify(self) -> dict[str, Any]:
        """Validate import success."""
        # 1. Query Odoo for imported products
        # 2. Compare with source data
        # 3. Report discrepancies
        if self.client:
            products = await self.client.search("product.product", [("name", "ilike", "%")])
        
        return {
            "mode": "verify",
            "products_in_odoo": len(products) if self.client else 0,
            "discrepancies": 0,
        }
```

### Step 3: Register in CLI

Update `src/codoo/__main__.py`:

```python
from codoo.tasks.products.import_task import ProductImportTask

async def _run_task(task_name: str, mode: TaskMode) -> None:
    """Run a task asynchronously."""
    if task_name == "import-products":
        task = ProductImportTask("ProductImportTask", client=self.client, evidence_dir=config.evidence_dir)
        result = await task.run(mode)
        typer.echo(f"✓ Complete: {result}")
    # ... more tasks
```

### Step 4: Test

```bash
# Inspect mode (diagnostics)
codoo task run --name import-products --mode inspect

# Dry-run (preview)
codoo task run --name import-products --mode dry-run

# Apply (execute)
codoo task run --name import-products --mode apply

# Verify (validate)
codoo task run --name import-products --mode verify
```

---

## Common Patterns

### Pattern 1: Data Import

**Legacy:**
```python
def import_contacts(csv_file):
    for row in csv.DictReader(open(csv_file)):
        client.create("res.partner", row)
```

**v1.0:**
```python
class ImportContactsTask(Task):
    async def _inspect(self) -> dict[str, Any]:
        records = read_csv("workspace/data/contacts.csv")
        return {"records_found": len(records)}
    
    async def _apply(self) -> dict[str, Any]:
        records = read_csv("workspace/data/contacts.csv")
        for record in records:
            await self.client.create("res.partner", record)
        return {"records_imported": len(records)}
    
    async def _verify(self) -> dict[str, Any]:
        contacts = await self.client.search("res.partner", [])
        return {"contacts_in_odoo": len(contacts)}
```

### Pattern 2: Batch Updates

**Legacy:**
```python
def update_products_prices(price_file):
    for sku, price in read_prices(price_file):
        product_id = client.search("product.product", [("barcode", "=", sku)])[0]
        client.write("product.product", [product_id], {"list_price": price})
```

**v1.0:**
```python
class UpdateProductPricesTask(Task):
    async def _dry_run(self) -> dict[str, Any]:
        updates = []
        for sku, price in read_prices("workspace/data/prices.csv"):
            products = await self.client.search("product.product", [("barcode", "=", sku)])
            if products:
                updates.append((products[0], price))
        return {"updates_to_apply": len(updates)}
    
    async def _apply(self) -> dict[str, Any]:
        count = 0
        for sku, price in read_prices("workspace/data/prices.csv"):
            products = await self.client.search("product.product", [("barcode", "=", sku)])
            if products:
                await self.client.write("product.product", products, {"list_price": price})
                count += 1
        return {"products_updated": count}
```

### Pattern 3: Report Generation

**Legacy:**
```python
def generate_executive_report():
    data = extract_data(client)
    pdf = create_pdf(data)
    save_pdf("reports/executive_report.pdf", pdf)
```

**v1.0:**
```python
class GenerateExecutivePdfTask(Task):
    async def _inspect(self) -> dict[str, Any]:
        return {"ready_to_generate": True}
    
    async def _apply(self) -> dict[str, Any]:
        data = await extract_data(self.client)
        pdf = await create_pdf(data)
        save_path = Path("docs/reports") / f"executive_{datetime.now().isoformat()}.pdf"
        save_pdf(save_path, pdf)
        return {"pdf_generated": str(save_path)}
    
    async def _verify(self) -> dict[str, Any]:
        # Check PDF exists and is readable
        return {"pdf_verified": True}
```

---

## Key Differences

### 1. Async/Await

**Legacy:**
```python
products = client.search(...)  # Synchronous, blocks
```

**v1.0:**
```python
products = await self.client.search(...)  # Async, non-blocking
```

### 2. Evidence Logging (Automatic)

**Legacy:**
```python
print(f"✓ Imported {count} products")
# Lost after script ends
```

**v1.0:**
```python
return {"products_imported": count}
# Automatically saved to docs/logs/<task>_<mode>_<timestamp>.json
```

### 3. Configuration (Type-Safe)

**Legacy:**
```python
client = OdooXMLRPCClient(
    host=os.environ.get("ODOO_HOST"),  # Might be None
    ...
)
```

**v1.0:**
```python
config = load_config()  # Raises ConfigurationError if missing
client = await create_odoo_client(config)  # Fully validated
```

### 4. Testing

**Legacy:**
```python
# No tests; had to run full script to validate
```

**v1.0:**
```python
@pytest.mark.asyncio
async def test_import_inspect():
    task = ProductImportTask()
    result = await task._inspect()
    assert result["ready_to_import"] is True
```

---

## Validation Checklist

Before marking a Task as complete:

- [ ] Task inherits from `Task` base class
- [ ] All 4 methods implemented: `_inspect()`, `_dry_run()`, `_apply()`, `_verify()`
- [ ] All methods are `async`
- [ ] Return type is `dict[str, Any]`
- [ ] No mutations in `_inspect()` or `_dry_run()`
- [ ] Async Odoo client used (not sync)
- [ ] Type hints complete
- [ ] Evidence logged automatically (Task base handles)
- [ ] Tests written (optional but recommended)
- [ ] Registered in CLI
- [ ] Tested manually: `codoo task run --name <task> --mode <mode>`

---

## Example: Full ProductImportTask

See [src/codoo/tasks/products/import_task.py](../../src/codoo/tasks/products/import_task.py) for a complete working example.

## FAQ

**Q: Can I keep using the old OdooXMLRPCClient?**
A: No, it's removed in v1.0. Use `AsyncOdooClient` instead (from `codoo.odoo.client`).

**Q: What if my script has complex business logic?**
A: Put business logic in separate functions/classes, call from Task methods. Task is just the orchestration layer.

**Q: Do I need to test everything?**
A: Recommended but not required. Focus on unit tests for `_inspect()` and `_dry_run()` (no Odoo connection needed).

**Q: How do I handle errors?**
A: Raise exceptions in Task methods. The Task.run() wrapper logs errors to evidence JSON.

---

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — Task base class reference
- [SETUP.md](SETUP.md) — Development environment
