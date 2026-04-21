#!/usr/bin/env python3
"""
Screenshot a sample site (top + mid + bottom) for quick visual verification.

Uses a python http.server subprocess (more reliable than threaded embedded
server on Windows when paired with Playwright).

Usage:
  python screenshot.py <sample-name> [<sample-name> ...]
"""
import asyncio
import socket
import subprocess
import sys
import time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
SAMPLES = ROOT / "samples"
OUT = ROOT / "screenshots"


def free_port() -> int:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def wait_ready(port: int, tries: int = 20) -> bool:
    for _ in range(tries):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.2)
    return False


async def snap(sample: str) -> None:
    sample_dir = SAMPLES / sample
    if not (sample_dir / "index.html").exists():
        print(f"[!] sample not found: {sample}")
        return

    OUT.mkdir(exist_ok=True)
    port = free_port()
    srv = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=str(sample_dir),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if not wait_ready(port):
        print(f"[!] server never came up on :{port}")
        srv.terminate()
        return

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--autoplay-policy=no-user-gesture-required",
                    "--disable-features=NetworkService",
                    "--winhttp-proxy-resolver",
                    "--no-proxy-server",
                ],
                proxy={"server": "direct://"},
            )
            ctx = await browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=1,
            )
            page = await ctx.new_page()
            page.on("pageerror", lambda e: print(f"[PAGE ERR] {sample}: {e}"))
            try:
                await page.goto(
                    f"http://127.0.0.1:{port}/?record=1",
                    wait_until="load",
                    timeout=20000,
                )
            except Exception as e:
                print(f"[goto warn] {sample}: {e}")
            # let curtain clear, fonts settle, video buffer
            await asyncio.sleep(6.0)

            # top
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(0.4)
            await page.screenshot(path=str(OUT / f"{sample}-01-top.png"), full_page=False)

            # mid 1
            total = await page.evaluate(
                "() => Math.max(document.documentElement.scrollHeight,"
                "document.body.scrollHeight) - window.innerHeight"
            )
            await page.evaluate(f"window.scrollTo(0, {int(total*0.33)})")
            await asyncio.sleep(0.6)
            await page.screenshot(path=str(OUT / f"{sample}-02-mid1.png"), full_page=False)

            # mid 2
            await page.evaluate(f"window.scrollTo(0, {int(total*0.6)})")
            await asyncio.sleep(0.6)
            await page.screenshot(path=str(OUT / f"{sample}-03-mid2.png"), full_page=False)

            # bot
            await page.evaluate(f"window.scrollTo(0, {int(total*0.88)})")
            await asyncio.sleep(0.6)
            await page.screenshot(path=str(OUT / f"{sample}-04-bot.png"), full_page=False)

            await ctx.close()
            await browser.close()
            print(f"[OK] {sample}: 4 shots saved")
    finally:
        srv.terminate()
        try:
            srv.wait(timeout=3)
        except subprocess.TimeoutExpired:
            srv.kill()


async def main(samples: list[str]) -> None:
    for s in samples:
        await snap(s)


if __name__ == "__main__":
    targets = sys.argv[1:] or ["dr-chaithanya"]
    asyncio.run(main(targets))
