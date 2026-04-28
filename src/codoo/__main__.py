"""CLI entry point for Codoo."""

import asyncio
from pathlib import Path

import typer

from codoo.config import load_config
from codoo.core.models import TaskMode
from codoo.core.evidence import list_evidence_logs, display_evidence
from codoo.ports.spec_loader import load_and_validate_spec
from codoo.tasks.products.import_task import ProductImportTask
from codoo.tasks.invoices.client_invoices_task import GenerateClientInvoicesTask
from codoo.tasks.analysis.audit_studio_apps import AuditStudioAppsTask
from codoo.tasks.projects.expand_studio_projetos_task import ExpandStudioProyectosTask
from codoo.tasks.projects.projetos_bootstrap_models import BootstrapProjetosModelsExecutor
from codoo.tasks.projects.studio_projetos_incremental import (
    Phase1Executor,
    Phase2Executor,
    Phase3Executor,
)

app = typer.Typer(
    name="codoo",
    help="Deterministic, AI-assisted Odoo development with full traceability",
)

config = load_config()


@app.command()
def task(
    action: str = typer.Argument("list", help="Task action (list, run)"),
    name: str = typer.Option(None, "--name", "-n", help="Task name"),
    mode: str = typer.Option("inspect", "--mode", "-m", help="Mode (inspect, dry-run, apply, verify)"),
) -> None:
    """Manage and run tasks."""
    if action == "list":
        typer.echo("Available tasks:")
        typer.echo("  - import-products")
        typer.echo("  - generate-client-invoices")
        typer.echo("  - audit-studio-apps")
        typer.echo("  - expand-studio-projetos")
        typer.echo("  - projetos-bootstrap-models")
        typer.echo("  - projetos-phase1")
        typer.echo("  - projetos-phase2")
        typer.echo("  - projetos-phase3")
        typer.echo("\nUse: codoo task run --name <task-name> --mode <mode>")
    elif action == "run":
        if not name:
            typer.echo("Error: --name required for 'run' action")
            raise typer.Exit(1)

        try:
            mode_enum = TaskMode(mode)
        except ValueError:
            typer.echo(f"Invalid mode: {mode}. Use one of: inspect, dry-run, apply, verify")
            raise typer.Exit(1)
        asyncio.run(_run_task(name, mode_enum))
    else:
        typer.echo(f"Unknown action: {action}")
        raise typer.Exit(1)


async def _run_task(task_name: str, mode: TaskMode) -> None:
    """Run a task asynchronously."""
    typer.echo(f"Running {task_name} in {mode.value} mode...")

    if task_name == "import-products":
        task = ProductImportTask("ProductImportTask", evidence_dir=config.evidence_dir)
        result = await task.run(mode)
        typer.echo(f"✓ Complete: {result}")
    elif task_name == "generate-client-invoices":
        task = GenerateClientInvoicesTask("GenerateClientInvoicesTask", evidence_dir=config.evidence_dir)
        result = await task.run(mode)
        typer.echo(f"✓ Complete: {result}")
    elif task_name == "audit-studio-apps":
        task = AuditStudioAppsTask("AuditStudioAppsTask", evidence_dir=config.evidence_dir)
        result = await task.run(mode)
        typer.echo(f"✓ Complete: {result}")
    elif task_name == "expand-studio-projetos":
        task = ExpandStudioProyectosTask("ExpandStudioProyectosTask", evidence_dir=config.evidence_dir)
        result = await task.run(mode)
        typer.echo(f"✓ Complete: {result}")
    elif task_name == "projetos-bootstrap-models":
        if mode != TaskMode.APPLY:
            typer.echo("projetos-bootstrap-models currently supports --mode apply")
            raise typer.Exit(1)
        result = await BootstrapProjetosModelsExecutor().execute()
        typer.echo(f"✓ Complete: {result.get('status')}")
        if result.get("status") != "PASSED":
            raise typer.Exit(1)
    elif task_name == "projetos-phase1":
        if mode != TaskMode.APPLY:
            typer.echo("projetos-phase1 currently supports --mode apply")
            raise typer.Exit(1)
        result = await Phase1Executor().execute()
        typer.echo(f"✓ Complete: {result.get('status')}")
        if result.get("status") != "PASSED":
            raise typer.Exit(1)
    elif task_name == "projetos-phase2":
        if mode != TaskMode.APPLY:
            typer.echo("projetos-phase2 currently supports --mode apply")
            raise typer.Exit(1)
        result = await Phase2Executor().execute()
        typer.echo(f"✓ Complete: {result.get('status')}")
        if result.get("status") != "PASSED":
            raise typer.Exit(1)
    elif task_name == "projetos-phase3":
        if mode != TaskMode.APPLY:
            typer.echo("projetos-phase3 currently supports --mode apply")
            raise typer.Exit(1)
        result = await Phase3Executor().execute()
        typer.echo(f"✓ Complete: {result.get('status')}")
        if result.get("status") != "PASSED":
            raise typer.Exit(1)
    else:
        typer.echo(f"Unknown task: {task_name}")
        raise typer.Exit(1)


@app.command()
def spec(
    action: str = typer.Argument("list", help="Spec action (init, validate, list)"),
    spec_id: str = typer.Option(None, "--id", help="Feature ID (e.g., FEAT-001)"),
    title: str = typer.Option(None, "--title", help="Feature title"),
    file: Path = typer.Option(None, "--file", "-f", help="Spec file path"),
) -> None:
    """Manage feature specifications."""
    if action == "list":
        typer.echo("Feature specifications:")
        typer.echo("  (Use: codoo spec init --id FEAT-001 --title 'Feature Title')")
    elif action == "init":
        if not spec_id or not title:
            typer.echo("Error: --id and --title required")
            raise typer.Exit(1)
        typer.echo(f"Creating spec: {spec_id} - {title}")
    elif action == "validate":
        if not file:
            typer.echo("Error: --file required")
            raise typer.Exit(1)
        asyncio.run(_validate_spec_cmd(file))
    else:
        typer.echo(f"Unknown action: {action}")
        raise typer.Exit(1)


async def _validate_spec_cmd(spec_file: Path) -> None:
    """Validate spec file."""
    try:
        spec = await load_and_validate_spec(spec_file)
        typer.echo(f"✓ Spec valid: {spec.id} - {spec.title}")
    except Exception as e:
        typer.echo(f"✗ Spec invalid: {e}", err=True)
        raise typer.Exit(1)


@app.command()
def evidence(
    action: str = typer.Argument("list", help="Evidence action (list, show)"),
    task_name: str = typer.Option(None, "--task", "-t", help="Filter by task name"),
    log_file: Path = typer.Option(None, "--file", "-f", help="Evidence log file"),
) -> None:
    """View evidence logs."""
    if action == "list":
        logs = list_evidence_logs(config.evidence_dir, task_name)
        if logs:
            typer.echo(f"Evidence logs ({len(logs)} found):")
            for log in logs[:10]:
                typer.echo(f"  {log.name}")
        else:
            typer.echo("No evidence logs found")
    elif action == "show":
        if not log_file:
            typer.echo("Error: --file required")
            raise typer.Exit(1)
        asyncio.run(display_evidence(log_file))
    else:
        typer.echo(f"Unknown action: {action}")
        raise typer.Exit(1)


@app.command()
def studio(
    action: str = typer.Argument("create-app", help="Studio action (create-app, list-apps, repair-app, delete-app)"),
    name: str = typer.Option(None, "--name", "-n", help="App display name"),
    model: str = typer.Option(None, "--model", help="Technical model name (optional, e.g. x_my_app)"),
    sequence: int = typer.Option(90, "--sequence", help="Root menu sequence"),
    icon: str = typer.Option("fa fa-cubes,#875A7B,#FFFFFF", "--icon", help="Launcher icon format"),
    yes: bool = typer.Option(False, "--yes", help="Apply destructive actions (otherwise dry-run)"),
    include_server_actions: bool = typer.Option(False, "--include-server-actions", help="Also delete ir.actions.server linked to model"),
) -> None:
    """Create Studio-style custom apps via Odoo API.

    Example:
        codoo studio create-app --name "Field Service" --model x_field_service
    """
    if action == "create-app":
        if not name:
            typer.echo("Error: --name is required")
            raise typer.Exit(1)
        asyncio.run(_studio_create_app(name, model, sequence, icon))
        return

    if action == "list-apps":
        asyncio.run(_studio_list_apps())
        return

    if action == "repair-app":
        if not model:
            typer.echo("Error: --model is required (e.g. x_my_app)")
            raise typer.Exit(1)
        asyncio.run(_studio_repair_app(model, icon))
        return

    if action == "delete-app":
        if not model:
            typer.echo("Error: --model is required (e.g. x_my_app)")
            raise typer.Exit(1)
        asyncio.run(_studio_delete_app(model, yes, include_server_actions))
        return

    typer.echo(f"Unknown studio action: {action}")
    raise typer.Exit(1)


async def _studio_create_app(name: str, model: str | None, sequence: int, icon: str) -> None:
    from codoo.odoo.client import AsyncOdooClient
    from codoo.odoo.studio import create_studio_app
    import json
    from datetime import datetime

    client = AsyncOdooClient(
        host=config.odoo_host,
        database=config.odoo_db,
        username=config.odoo_username,
        password=config.odoo_password,
    )
    try:
        typer.echo(f"Connecting to {config.odoo_host} ...")
        await client.authenticate()
        typer.echo(f"Creating app '{name}' ...")

        created = await create_studio_app(
            client,
            app_name=name,
            model_name=model,
            menu_sequence=sequence,
            menu_icon=icon,
            create_demo_record=False,
        )

        typer.echo("✓ App created")
        typer.echo(f"  model: {created['model']}")
        typer.echo(f"  menu_id: {created['menu_id']}")
        typer.echo(f"  action_id: {created['action_id']}")

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        log_path = config.evidence_dir / f"studio_create_app_{ts}.json"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(json.dumps(created, indent=2, ensure_ascii=False))
        typer.echo(f"Evidence → {log_path}")
    finally:
        await client.close()


async def _studio_list_apps() -> None:
    from codoo.odoo.client import AsyncOdooClient
    from codoo.odoo.studio import list_studio_apps

    client = AsyncOdooClient(
        host=config.odoo_host,
        database=config.odoo_db,
        username=config.odoo_username,
        password=config.odoo_password,
    )
    try:
        typer.echo(f"Connecting to {config.odoo_host} ...")
        await client.authenticate()

        apps = await list_studio_apps(client)
        if not apps:
            typer.echo("No Studio-style apps found")
            return

        typer.echo(f"Studio-style apps ({len(apps)}):")
        for a in apps:
            typer.echo(
                "  "
                f"model={a['model']} | menu_id={a['menu_id']} | "
                f"icon={a['menu_has_icon']} | acl_count={a['acl_count']}"
            )
    finally:
        await client.close()


async def _studio_repair_app(model: str, icon: str) -> None:
    from codoo.odoo.client import AsyncOdooClient
    from codoo.odoo.studio import repair_studio_app
    import json
    from datetime import datetime

    client = AsyncOdooClient(
        host=config.odoo_host,
        database=config.odoo_db,
        username=config.odoo_username,
        password=config.odoo_password,
    )
    try:
        typer.echo(f"Connecting to {config.odoo_host} ...")
        await client.authenticate()
        typer.echo(f"Repairing app model '{model}' ...")

        repaired = await repair_studio_app(client, model_name=model, menu_icon=icon)
        typer.echo("✓ Repair complete")
        typer.echo(f"  model: {repaired['model']}")
        typer.echo(f"  menu_id: {repaired['menu_id']}")
        typer.echo(f"  action_id: {repaired['action_id']}")

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        log_path = config.evidence_dir / f"studio_repair_app_{model}_{ts}.json"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(json.dumps(repaired, indent=2, ensure_ascii=False))
        typer.echo(f"Evidence → {log_path}")
    finally:
        await client.close()


async def _studio_delete_app(model: str, yes: bool, include_server_actions: bool) -> None:
    from codoo.odoo.client import AsyncOdooClient
    from codoo.odoo.studio import delete_studio_app
    import json
    from datetime import datetime

    client = AsyncOdooClient(
        host=config.odoo_host,
        database=config.odoo_db,
        username=config.odoo_username,
        password=config.odoo_password,
    )
    try:
        typer.echo(f"Connecting to {config.odoo_host} ...")
        await client.authenticate()
        typer.echo(f"Planning delete for app model '{model}' ...")

        result = await delete_studio_app(
            client,
            model_name=model,
            include_server_actions=include_server_actions,
            dry_run=not yes,
        )

        counts = result["counts"]
        typer.echo("Delete plan:")
        typer.echo(
            "  "
            f"fields={counts['fields']}, views={counts['views']}, actions={counts['actions']}, "
            f"menus={counts['menus']}, acls={counts['acls']}, server_actions={counts['server_actions']}"
        )

        if not yes:
            typer.echo("Dry-run complete. Re-run with --yes to execute deletion.")
        else:
            typer.echo("✓ Delete complete")

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        log_path = config.evidence_dir / f"studio_delete_app_{model}_{ts}.json"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(json.dumps(result, indent=2, ensure_ascii=False))
        typer.echo(f"Evidence → {log_path}")
    finally:
        await client.close()


@app.command()
def agent(
    request: str = typer.Argument(None, help="Natural language request for the Odoo agent"),
    schema_file: Path = typer.Option(
        None, "--schema", "-s",
        help="Path to cached schema JSON (from 'codoo agent discover'). Skips live discovery.",
    ),
    model: str = typer.Option("gemini-2.0-flash", "--model", help="Gemini model name"),
    discover: bool = typer.Option(False, "--discover", "-d", help="Discover and cache schema then exit"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Print execution steps"),
) -> None:
    """Run the Gemini-powered Odoo agent orchestrator.

    Examples:
        codoo agent --discover                          # Discover schema, cache to docs/logs/
        codoo agent "List all open sale orders"
        codoo agent "How many contacts are in the CRM?" --verbose
        codoo agent "Create a project named Q3 Planning" -s docs/logs/schema.json
    """
    asyncio.run(_run_agent(request, schema_file, model, discover, verbose))


async def _run_agent(
    request: str | None,
    schema_file: Path | None,
    gemini_model: str,
    discover: bool,
    verbose: bool,
) -> None:
    from codoo.agents.schema import build_schema, OdooSchema
    from codoo.agents.orchestrator import OdooOrchestrator
    from codoo.odoo.client import AsyncOdooClient
    import json
    from datetime import datetime

    if not config.codoo_gemini_api_key and not discover:
        typer.echo("Error: CODOO_GEMINI_API_KEY not set in .env", err=True)
        raise typer.Exit(1)

    client = AsyncOdooClient(
        host=config.odoo_host,
        database=config.odoo_db,
        username=config.odoo_username,
        password=config.odoo_password,
    )

    try:
        typer.echo(f"Connecting to {config.odoo_host} ...")
        uid = await client.authenticate()
        typer.echo(f"Authenticated as uid={uid}")

        # Schema: load from cache or discover live
        schema: OdooSchema
        if schema_file and schema_file.exists():
            typer.echo(f"Loading schema from {schema_file}")
            schema = OdooSchema.load(schema_file)
        else:
            typer.echo("Discovering schema (models + server actions) ...")
            schema = await build_schema(client)
            typer.echo(schema.summary())

            # Auto-save schema
            ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            out = config.evidence_dir / f"schema_{config.odoo_db}_{ts}.json"
            schema.save(out)
            typer.echo(f"Schema saved → {out}")

        if discover:
            return  # Discovery only mode

        if not request:
            typer.echo("Error: provide a request, e.g.: codoo agent 'List all customers'", err=True)
            raise typer.Exit(1)

        typer.echo(f"\nRequest: {request}\n")
        orchestrator = await OdooOrchestrator.create(
            client, schema, config.codoo_gemini_api_key, gemini_model
        )
        result = await orchestrator.run(request)

        if verbose and result.steps:
            typer.echo("── Steps ──────────────────────────────────────")
            for step in result.steps:
                typer.echo(f"  [{step.iteration}] {step.tool_name}")
                if step.result.get("error"):
                    typer.echo(f"      ERROR: {step.result['error']}")
                else:
                    data = step.result.get("data")
                    if isinstance(data, list):
                        typer.echo(f"      → {len(data)} records")
                    else:
                        typer.echo(f"      → {str(data)[:120]}")
            typer.echo("───────────────────────────────────────────────\n")

        typer.echo("Answer:")
        typer.echo(result.answer)

        # Save evidence
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        log_path = config.evidence_dir / f"agent_run_{ts}.json"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(json.dumps({
            "request": request,
            "host": config.odoo_host,
            "database": config.odoo_db,
            **result.to_dict(),
        }, indent=2, ensure_ascii=False))
        typer.echo(f"\nEvidence → {log_path}")

    finally:
        await client.close()


if __name__ == "__main__":
    app()
