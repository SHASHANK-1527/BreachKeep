#!/usr/bin/env bash
# ==============================================================================
# bk-labs: List active BreachKeep student lab containers with user details
# ==============================================================================
set -euo pipefail

if [ "${1:-}" = "stop-all" ]; then
  echo "Stopping all active student lab containers..."
  docker ps --format '{{.Names}}' | grep -E '(^|/)bk_' | while read -r CNAME; do
    CNAME="${CNAME#/}"
    if [ "$CNAME" != "bk_capstone" ]; then
      echo "  - Stopping $CNAME..."
      docker stop "$CNAME" >/dev/null 2>&1 || true
      docker rm -f "$CNAME" >/dev/null 2>&1 || true
    fi
  done
  echo "Done."
  exit 0
fi

if [ "${1:-}" = "stop" ] && [ -n "${2:-}" ]; then
  TARGET="$2"
  echo "Stopping lab containers matching '$TARGET'..."
  docker ps --format '{{.Names}}' | grep -E "(^|/)bk_.*$TARGET" | while read -r CNAME; do
    CNAME="${CNAME#/}"
    echo "  - Stopping $CNAME..."
    docker stop "$CNAME" >/dev/null 2>&1 || true
    docker rm -f "$CNAME" >/dev/null 2>&1 || true
  done
  echo "Done."
  exit 0
fi

# Find all running containers matching bk_
LAB_CONTAINERS=$(docker ps --format '{{.Names}}\t{{.Status}}\t{{.RunningFor}}' | grep -E '(^|/)bk_' || true)

if [ -z "$LAB_CONTAINERS" ]; then
  echo "No active student lab containers found."
  exit 0
fi

# Locate the mongo container
MONGO_CONTAINER=$(docker ps --format '{{.Names}}' | grep 'mongo' | head -n 1 || true)

if [ -z "$MONGO_CONTAINER" ]; then
  echo "Warning: Mongo container not found. Listing raw containers:"
  printf "%-35s %-20s %s\n" "CONTAINER" "STATUS" "UPTIME"
  echo "$LAB_CONTAINERS" | while IFS=$'\t' read -r CNAME STATUS UPTIME; do
    printf "%-35s %-20s %s\n" "$CNAME" "$STATUS" "$UPTIME"
  done
  exit 0
fi

# Print table header
printf "%-18s %-28s %-24s %-20s %s\n" "USERNAME" "EMAIL" "STUDENT_ID" "ROOM" "UPTIME"
printf "%-18s %-28s %-24s %-20s %s\n" "------------------" "----------------------------" "------------------------" "--------------------" "------"

# Process each container
while IFS=$'\t' read -r CNAME STATUS UPTIME; do
  CNAME="${CNAME#/}" # strip leading slash if present

  if [ "$CNAME" = "bk_capstone" ]; then
    printf "%-18s %-28s %-24s %-20s %s\n" "[CAPSTONE]" "(shared target)" "-" "capstone" "$UPTIME"
    continue
  fi

  # Expected name: bk_<studentId>_<roomSlug>
  SID=$(echo "$CNAME" | cut -d'_' -f2)
  ROOM=$(echo "$CNAME" | cut -d'_' -f3-)

  # Query Mongo safely
  USER_INFO=$(docker exec -i "$MONGO_CONTAINER" mongosh breachkeep --quiet --eval "
    try {
      const u = db.users.findOne({ _id: ObjectId('$SID') }, { username: 1, email: 1 });
      if (u) print(u.username + '\t' + (u.email || '-'));
      else print('Unknown\t-');
    } catch(e) {
      print('Unknown\t-');
    }
  " 2>/dev/null | tr -d '\r')

  USERNAME=$(echo "$USER_INFO" | cut -f1)
  EMAIL=$(echo "$USER_INFO" | cut -f2)

  printf "%-18s %-28s %-24s %-20s %s\n" "${USERNAME:-Unknown}" "${EMAIL:--}" "$SID" "$ROOM" "$UPTIME"
done <<< "$LAB_CONTAINERS"
