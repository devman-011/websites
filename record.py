#!/usr/bin/env python3
"""
Record a smooth scroll-through of a sample clinic site.

Runs fully headlessly — spins up a hidden Chromium, scrolls the page
top-to-bottom, and captures the viewport to mp4. Your desktop is untouched;
you can keep working while it runs.

The page is told it's being recorded (?record=1), so the template JS
disables heavyweight effects (Lenis smooth-scroll, magnetic buttons, tilt)
to keep frame rendering cheap and the output smooth.

Usage:
  python record.py                               default: dr-chaithanya, 1280x720, 45s
  python record.py dr-chaithanya
  python record.py dr-chaithanya --duration 60
  python record.py dr-chaithanya --size 1920x1080
"""

import argparse
import asyncio
import http.server
import socketserver
import subprocess
import sys
import threading
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
SAMPLES_DIR = ROOT / "samples"
RECORDINGS_DIR = ROOT / "recordings"
PORT = 8765  # isolated port so this never collides with the dev server

FFMPEG = Path(
    "C:/Users/thema/AppData/Local/Microsoft/WinGet/Packages/"
    "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/"
    "ffmpeg-8.1-full_build/bin/ffmpeg.exe"
)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args, **kwargs):
        return


def start_temp_server(directory: Path, port: int) -> socketserver.TCPServer:
    """Serve the given directory on 127.0.0.1:port in a daemon thread."""
    def handler_factory(*a, **k):
        return QuietHandler(*a, directory=str(directory), **k)
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", port), handler_factory)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def record_scroll(sample_dir: Path,
                        out_mp4: Path,
                        duration: float,
                        width: int,
                        height: int) -> None:
    server = start_temp_server(sample_dir, PORT)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--autoplay-policy=no-user-gesture-required",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-background-timer-throttling",
                    "--disable-renderer-backgrounding",
                    "--disable-backgrounding-occluded-windows",
                    "--force-device-scale-factor=1",
                    "--disable-features=TranslateUI,IsolateOrigins,site-per-process",
                ],
            )
            context = await browser.new_context(
                viewport={"width": width, "height": height},
                device_scale_factor=1,
                record_video_dir=str(RECORDINGS_DIR),
                record_video_size={"width": width, "height": height},
            )
            page = await context.new_page()

            url = f"http://127.0.0.1:{PORT}/?record=1"
            print(f"    > loading {url}")
            try:
                await page.goto(url, wait_until="load", timeout=30000)
            except Exception as e:
                print(f"[!] page load: {e}")

            # Curtain + font swap + video buffer
            await asyncio.sleep(3.5)

            # Measure scroll distance (just for logging)
            total_scroll = await page.evaluate(
                "() => Math.max("
                "document.documentElement.scrollHeight,"
                "document.body.scrollHeight"
                ") - window.innerHeight"
            )
            print(f"    > page scrollHeight: {int(total_scroll)}px")
            print(f"    > scrolling smoothly over {duration:.0f}s via RAF")

            # Inside the page: drive scrollY every requestAnimationFrame
            # tick. This advances scroll on every Chromium render frame
            # (native ~60Hz), so every captured video frame shows a slightly
            # different position — genuinely smooth, no stepping.
            await page.evaluate("""
                (duration) => new Promise(resolve => {
                    const maxY = Math.max(
                        document.documentElement.scrollHeight,
                        document.body.scrollHeight
                    ) - window.innerHeight;
                    const t0 = performance.now();
                    function tick(now) {
                        const p = Math.min(1, (now - t0) / (duration * 1000));
                        // Soft ease-out at the very end so it doesn't
                        // slam into the footer; linear through the middle.
                        const eased = p < 0.92
                            ? p
                            : 0.92 + (1 - Math.pow(1 - (p - 0.92) / 0.08, 3)) * 0.08;
                        window.scrollTo(0, maxY * eased);
                        if (p < 1) requestAnimationFrame(tick);
                        else resolve();
                    }
                    requestAnimationFrame(tick);
                })
            """, duration)

            # Settle on the footer
            await asyncio.sleep(1.5)

            await context.close()
            await browser.close()

            webms = sorted(RECORDINGS_DIR.glob("*.webm"),
                           key=lambda q: q.stat().st_mtime)
            if not webms:
                raise RuntimeError("no webm produced by playwright")
            webm = webms[-1]

            # Direct webm -> mp4 transcode (no speed rescale — capture is
            # already at real-time rendering speed since heavy JS is disabled).
            print(f"    > encoding mp4…")
            result = subprocess.run(
                [
                    str(FFMPEG), "-y", "-i", str(webm),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    "-r", "30",
                    str(out_mp4),
                ],
                capture_output=True, text=True,
            )
            if result.returncode != 0:
                print("[!] ffmpeg failed:\n" + result.stderr[-800:])
                raise SystemExit(1)

            try:
                webm.unlink()
            except OSError:
                pass
    finally:
        server.shutdown()
        server.server_close()


def parse_size(text: str):
    try:
        w, h = text.lower().split("x")
        return int(w), int(h)
    except Exception:
        raise argparse.ArgumentTypeError("size must be WIDTHxHEIGHT, e.g. 1920x1080")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Record a headless scroll-through of a clinic sample site.",
    )
    parser.add_argument("sample", nargs="?", default="dr-chaithanya",
                        help="folder name under samples/ (default: dr-chaithanya)")
    parser.add_argument("--duration", type=float, default=45.0,
                        help="total scroll duration in seconds (default: 45)")
    parser.add_argument("--size", type=parse_size, default=(1280, 720),
                        help="viewport size WIDTHxHEIGHT (default: 1280x720)")
    args = parser.parse_args()

    sample_dir = SAMPLES_DIR / args.sample
    if not sample_dir.exists() or not (sample_dir / "index.html").exists():
        print(f"[!] sample not found: {sample_dir}")
        if SAMPLES_DIR.exists():
            found = [p.name for p in SAMPLES_DIR.iterdir() if p.is_dir()]
            print(f"    available: {found}")
        sys.exit(1)

    RECORDINGS_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_mp4 = RECORDINGS_DIR / f"{args.sample}-{stamp}.mp4"
    width, height = args.size

    print(f"[*] Recording: {args.sample}")
    print(f"    size:      {width}x{height}")
    print(f"    duration:  {args.duration:.0f}s")
    print(f"    output:    {out_mp4}")
    asyncio.run(record_scroll(sample_dir, out_mp4, args.duration, width, height))
    size_mb = out_mp4.stat().st_size / 1024 / 1024
    print(f"[OK] Done: {out_mp4}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
