FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN pip install uv

# Copy project files
COPY pyproject.toml uv.lock ./

# Sync dependencies using uv
RUN uv sync

# Copy rest of project
COPY . .

# Expose command
ENTRYPOINT ["python", "-m", "codoo"]
CMD ["--help"]
