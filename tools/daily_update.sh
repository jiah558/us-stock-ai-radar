#!/usr/bin/env bash
# Daily update: fetch real closes -> convert report Markdown -> (optionally) publish.
# Usage: tools/daily_update.sh 2026-09-25 [path/to/report.md] [--push]
set -euo pipefail
cd "$(dirname "$0")/.."
DATE="${1:?usage: daily_update.sh YYYY-MM-DD [report.md] [--push]}"
MD="${2:-../usstock/report-$DATE.md}"
PY="${PYTHON:-python3}"
"$PY" tools/fetch_prices.py --date "$DATE"
"$PY" tools/md2json.py --md "$MD" --date "$DATE"
if [[ " $* " == *" --push "* ]]; then
  git add data/index.json "data/reports/$DATE.json"
  git commit -m "report: $DATE" && git push
fi
