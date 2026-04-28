"""FAME data source adapter."""

from pathlib import Path
from typing import Any, Optional


class FameDataAdapter:
    """
    Adapter for reading FAME data files.

    FAME data is stored in workspace/data/ and workspace/data_prepared/.
    """

    def __init__(self, data_dir: Path = Path("workspace/data")) -> None:
        """
        Initialize FAME data adapter.

        Args:
            data_dir: Root data directory
        """
        self.data_dir = Path(data_dir)
        self.prepared_dir = self.data_dir.parent / "data_prepared"

    def list_data_files(self, subdir: Optional[str] = None) -> list[Path]:
        """
        List data files in data directory.

        Args:
            subdir: Optional subdirectory filter

        Returns:
            List of data file paths
        """
        if subdir:
            search_dir = self.data_dir / subdir
        else:
            search_dir = self.data_dir

        if not search_dir.exists():
            return []

        return sorted(search_dir.glob("**/*.csv")) + sorted(search_dir.glob("**/*.xlsx"))

    def read_csv(self, filepath: Path) -> list[dict[str, Any]]:
        """
        Read CSV file as list of dicts.

        Args:
            filepath: Path to CSV file

        Returns:
            List of records
        """
        import csv

        records = []
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(row)

        return records
