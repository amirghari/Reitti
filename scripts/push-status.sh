#!/usr/bin/env bash
# End of every session: push STATUS.md and reports/daily/*.md to the branch "status" on
# GitHub, never to main, so Amir's orchestrator session can read them when the Mac is off.
# Copied from quote-desk-demo, where Amir set the pattern (2026-11-05); for this repo he asked
# for the same on 2026-11-06. The files stay untracked in the main checkout
# (.git/info/exclude); this copies them into a throwaway worktree of "status", commits and
# pushes. No personal data in either file: no professional's details and nothing anyone
# answered.
#   scripts/push-status.sh            (from the main checkout or any worktree)
set -euo pipefail

# The carry script beside this one, never the main checkout's, which may be on
# an older branch.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
common="$(git rev-parse --path-format=absolute --git-common-dir)"
main="$(dirname "$common")"
parent="$(mktemp -d)"
tmp="$parent/status"
cleanup() {
  git -C "$main" worktree remove --force "$tmp" 2>/dev/null || true
  rm -rf "$parent"
}
trap cleanup EXIT

# Copy the two files over what "status" holds and commit; 1 when nothing changed,
# 2 when a generated section could not be kept (then nothing is pushed).
# STATUS.md's directory-liveness section is written on GitHub every morning by
# .github/workflows/directory-liveness.yml, and its re-verification section on the
# 1st of each month by directory-reverify.yml, so both are kept from "status"
# rather than overwritten, and copied back into the local file so the session sees them.
# set -e does not reach inside a function called as a condition, so the carry
# checks its own result: a failed carry must never fall through to the copy.
commit_copy() {
  mkdir -p "$tmp/reports/daily"
  if [ -f "$tmp/STATUS.md" ] && grep -qF 'liveness:start' "$tmp/STATUS.md"; then
    node "$here/liveness-status.mjs" carry "$tmp/STATUS.md" "$main/STATUS.md" || return 2
  fi
  if [ -f "$tmp/STATUS.md" ] && grep -qF 'reverify:start' "$tmp/STATUS.md"; then
    node "$here/reverify.mjs" carry "$tmp/STATUS.md" "$main/STATUS.md" || return 2
  fi
  cp -p "$main/STATUS.md" "$tmp/STATUS.md"
  if compgen -G "$main/reports/daily/*.md" >/dev/null; then
    cp -p "$main"/reports/daily/*.md "$tmp/reports/daily/"
  fi
  # -f: both paths are in .git/info/exclude, which every worktree shares.
  git -C "$tmp" add -f STATUS.md reports
  git -C "$tmp" diff --cached --quiet && return 1
  git -C "$tmp" commit -q -m "Status $(date '+%Y-%m-%d %H:%M')"
}

git -C "$main" fetch -q origin status
git -C "$main" worktree add -q --detach "$tmp" origin/status
# 0 committed, 1 nothing changed, 2 a generated section would be lost.
copy_or_stop() {
  local rc=0
  commit_copy || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "push-status: could not keep a generated section (liveness or re-verification) from origin/status; nothing pushed" >&2
    exit 1
  fi
  if [ "$rc" -ne 0 ]; then
    echo "push-status: nothing changed"
    exit 0
  fi
}
copy_or_stop
# Another session may have pushed in between. Both copy the same files from this
# checkout, so nothing needs merging: start again from GitHub's "status" and copy again.
if ! git -C "$tmp" push -q origin HEAD:status; then
  git -C "$tmp" fetch -q origin status
  git -C "$tmp" reset -q --hard origin/status
  copy_or_stop
  git -C "$tmp" push -q origin HEAD:status
fi
echo "push-status: pushed $(git -C "$tmp" rev-parse --short HEAD) to origin/status"
