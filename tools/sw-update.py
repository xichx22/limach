#!/usr/bin/env python3
"""sw.js 를 실제 파일 목록에 맞춘다.

두 가지를 손으로 하다 보면 반드시 빼먹는다:

1. **버전 올리기** — sw.js 의 fetch 규칙을 보면 `/img/` 는 저장해둔 걸 먼저 쓴다.
   그래서 사진을 바꿔도 폰은 옛날 사진을 계속 보여준다. 버전이 바뀌어야
   옛 저장분이 통째로 버려진다. (코드·화면은 인터넷을 먼저 보므로 버전과 무관하게
   바로 반영된다 — 즉 이 버전 올리기는 **사진 때문에** 필요한 것이다.)

2. **SHELL 목록** — 게임을 추가하고 여기 안 넣으면, 인터넷이 없을 때만 그 게임이
   안 열린다. 집에서 테스트하면 멀쩡해 보여서 늦게 발견된다.

  python3 tools/sw-update.py           지금 상태 보기 (고치지 않음)
  python3 tools/sw-update.py --write   SHELL 만 실제 파일에 맞춤
  python3 tools/sw-update.py --bump    SHELL 맞추고 버전도 한 칸 올림
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / "sw.js"

# 사진(img/)은 일부러 뺀다 — 101장 6MB 를 설치할 때 통째로 받으면 앱이 늦게 뜬다.
# 사진은 게임에서 처음 만났을 때 하나씩 저장된다.
FIXED = ["./", "./index.html", "./manifest.webmanifest"]
ICONS = ["./icon-192.png", "./icon-512.png"]


def wanted_shell() -> list[str]:
    css = sorted(f"./css/{p.name}" for p in (ROOT / "css").glob("*.css"))
    js = sorted(f"./js/{p.name}" for p in (ROOT / "js").glob("*.js"))
    games = sorted(f"./js/games/{p.name}" for p in (ROOT / "js/games").glob("*.js"))
    return FIXED + css + js + games + ICONS


def main() -> int:
    bump = "--bump" in sys.argv
    write = bump or "--write" in sys.argv
    src = SW.read_text(encoding="utf-8")

    m_ver = re.search(r"var CACHE = 'jihan-play-v(\d+)';", src)
    m_shell = re.search(r"var SHELL = \[.*?\];", src, re.S)
    if not m_ver or not m_shell:
        print("sw.js 모양이 예상과 다르다. 손으로 봐야 한다.", file=sys.stderr)
        return 1

    ver = int(m_ver.group(1))
    have = set(re.findall(r"'(\./[^']*)'", m_shell.group(0)))
    want = wanted_shell()

    added = [p for p in want if p not in have]
    gone = [p for p in have if p not in want]

    if not write:
        print(f"버전 v{ver} · SHELL {len(have)}개")
        for p in added:
            print(f"  빠져 있음: {p}")
        for p in gone:
            print(f"  파일 없음: {p}")
        if not added and not gone:
            print("  SHELL 은 파일과 일치한다")
        return 0

    # 한 줄에 하나씩 쓴다. 나중에 git diff 에서 뭐가 늘고 줄었는지 바로 보인다.
    body = ",\n".join(f"  '{p}'" for p in want)
    out = src[:m_shell.start()] + f"var SHELL = [\n{body}\n];" + src[m_shell.end():]

    if bump:
        out = out.replace(f"var CACHE = 'jihan-play-v{ver}';",
                          f"var CACHE = 'jihan-play-v{ver + 1}';", 1)

    SW.write_text(out, encoding="utf-8")

    # 망가진 sw.js 를 배포하면 앱이 통째로 안 뜬다. 쓰고 나서 반드시 확인한다.
    check = subprocess.run(["node", "--check", str(SW)], capture_output=True, text=True)
    if check.returncode != 0:
        SW.write_text(src, encoding="utf-8")          # 되돌린다
        print(f"sw.js 가 깨져서 되돌렸다:\n{check.stderr}", file=sys.stderr)
        return 1

    if bump:
        print(f"sw.js 버전 v{ver} → v{ver + 1}")
    for p in added:
        print(f"  SHELL 에 추가: {p}")
    for p in gone:
        print(f"  SHELL 에서 제거: {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
