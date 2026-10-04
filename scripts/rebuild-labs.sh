#!/usr/bin/env bash
# ==============================================================================
# rebuild-labs.sh: Stop all lab containers and rebuild lab images freshly
# Usage:
#   ./scripts/rebuild-labs.sh             # Rebuilds base and all lab images
#   ./scripts/rebuild-labs.sh terminal    # Rebuilds base and only terminal labs
#   ./scripts/rebuild-labs.sh --clean     # Deletes all cached breachkeep images first
# ==============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== 1. Stopping & removing all active lab containers ==="
LAB_CONTAINERS=$(docker ps -a --format '{{.Names}}' | grep -E '(^|/)bk_' || true)
if [ -n "$LAB_CONTAINERS" ]; then
  echo "$LAB_CONTAINERS" | while read -r cname; do
    cname="${cname#/}"
    echo "  Removing container: $cname"
    docker rm -f "$cname" >/dev/null 2>&1 || true
  done
  echo "All lab containers removed."
else
  echo "No active lab containers to remove."
fi

# Optional clean flag
CLEAN=false
TARGET="all"
for arg in "$@"; do
  if [ "$arg" = "--clean" ]; then
    CLEAN=true
  else
    TARGET="$arg"
  fi
done

if [ "$CLEAN" = true ]; then
  echo "=== Removing old breachkeep images to ensure clean rebuild ==="
  docker images --format '{{.Repository}}:{{.Tag}}' | grep '^breachkeep/' | while read -r img; do
    echo "  Removing image: $img"
    docker rmi -f "$img" >/dev/null 2>&1 || true
  done
fi

echo "=== 2. Rebuilding base image (breachkeep/base) ==="
docker build -t breachkeep/base:latest labs/base

build_context() {
  local ctx="$1"
  if [ ! -d "labs/$ctx" ]; then return 0; fi
  echo "=== Building $ctx labs ==="
  for df in labs/"$ctx"/Dockerfile.*; do
    if [ -f "$df" ]; then
      local fname
      fname=$(basename "$df")
      local room="${fname#Dockerfile.}"
      echo "  -> Building breachkeep/$room:latest from $df..."
      docker build -t "breachkeep/$room:latest" -f "$df" "labs/$ctx"
    fi
  done
}

if [ "$TARGET" = "all" ] || [ "$TARGET" = "terminal" ]; then
  build_context "terminal"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "network" ]; then
  build_context "network"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "web" ]; then
  build_context "web"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "secure-coding" ]; then
  build_context "secure-coding"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "capstone" ]; then
  build_context "capstone"
fi

echo "=== Done! Lab images rebuilt successfully. ==="
docker images | grep '^breachkeep/' || true
