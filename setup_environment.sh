#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Project root: $ROOT"

check_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command '$1' not found. Please install it and re-run." >&2
    exit 1
  fi
}

echo "Checking required tools..."
for cmd in python3 pip3 npm mvn java; do
  check_cmd "$cmd"
done

echo "\n1) Setting up Python environment for ai_module"
cd "$ROOT/ai_module"
if [ -d .venv ]; then
  echo "Found existing virtualenv at ai_module/.venv — skipping creation."
else
  python3 -m venv .venv
  echo "Created virtualenv at ai_module/.venv"
fi
. .venv/bin/activate
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
else
  echo "Warning: ai_module/requirements.txt not found."
fi
deactivate
cd "$ROOT"

echo "\n2) Building backend (Maven)"
if [ -f backend/pom.xml ]; then
  mvn -f backend/pom.xml clean package -DskipTests
else
  echo "Warning: backend/pom.xml not found — skipping backend build."
fi

echo "\n3) Installing frontend dependencies"
if [ -f frontend/package.json ]; then
  cd frontend
  npm install
  cd "$ROOT"
else
  echo "Warning: frontend/package.json not found — skipping frontend install."
fi

echo "\nSetup script finished. Next manual steps:"
echo "- Create MySQL database and run database/schema.sql (see database/README.md)"
echo "  Example: mysql -u root -p youtubeai < database/schema.sql"
echo "- Configure backend DB credentials in backend/src/main/resources/application.properties or via environment variables"
echo "- To run backend locally: mvn -f backend spring-boot:run (or run the generated jar in backend/target)"
echo "- To run frontend locally: cd frontend && npm run dev"

echo "If you need PhoBERT / GPU setup, install PyTorch separately following project's docs."

exit 0
