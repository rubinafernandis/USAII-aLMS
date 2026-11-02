#!/usr/bin/env bash
# Real-world learner journey in a browser, start to finish, on a fresh data folder:
#   instructor makes Course 6 free and publishes it -> a new learner signs up and joins from Explore Courses
#   -> all 10 days (reload halfway through a template, a practice-check retake, reflections never saved by hand)
#   -> fails the final once, tries again and passes -> instructor approves the evidence package
#   -> certificate, Vault counts, and the same learner on a phone-size screen.
# Usage: tests/run-realworld.sh <output_dir>   (needs: npm run build, python3 + playwright)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="${1:-/tmp/realworld}"; mkdir -p "$OUT"
W="$(mktemp -d)"; for f in server shared src public index.html vite.config.ts tsconfig.json package.json node_modules dist; do ln -s "$ROOT/$f" "$W/$f"; done
( cd "$W" && PORT=4699 NODE_ENV=production SEED_INSTRUCTOR_PASSWORD='VJ%NTj+R%zgvTp3wmc' SEED_LEARNER_PASSWORD='7rcV%5qXmNTFttj_Dw' PUBLIC_URL=http://127.0.0.1:4699 \
  exec node "$ROOT/node_modules/tsx/dist/cli.mjs" server/index.ts > "$OUT/server.log" 2>&1 ) & SRV=$!
for i in $(seq 240); do curl -sf 127.0.0.1:4699/api/health >/dev/null && break; sleep 0.5; done
timeout 900 python3 -u "$ROOT/tests/realworld_learner.py" http://127.0.0.1:4699 "$OUT"; CODE=$?
kill $SRV 2>/dev/null; sleep 1; rm -rf "$W" 2>/dev/null || true
exit $CODE
