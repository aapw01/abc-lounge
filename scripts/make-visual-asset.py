import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "lounge-terminal-texture.png"


def chunk(kind: bytes, data: bytes) -> bytes:
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def mix(a: int, b: int, amount: float) -> int:
    return int(a * (1 - amount) + b * amount)


def color_at(x: int, y: int, width: int, height: int) -> tuple[int, int, int]:
    vertical = y / height
    r = mix(237, 221, vertical)
    g = mix(243, 235, vertical)
    b = mix(241, 226, vertical)

    route = abs(((x + y * 2) % 180) - 90)
    if route < 2:
        r, g, b = 201, 213, 202

    board = 760 < x < 1110 and 74 < y < 360
    if board and (abs(x - 760) < 5 or abs(x - 1110) < 5 or abs(y - 74) < 5 or abs(y - 360) < 5):
        r, g, b = 20, 102, 79
    if board and (abs(y - 135) < 3 or abs(y - 210) < 3 or abs(y - 285) < 3) and 790 < x < 1080:
        r, g, b = 185, 137, 50

    for stand_x in range(120, width, 220):
        is_sign_edge = (
            stand_x < x < stand_x + 120
            and 120 < y < 180
            and (abs(y - 120) < 3 or abs(y - 180) < 3 or abs(x - stand_x) < 3 or abs(x - stand_x - 120) < 3)
        )
        leg_left = abs((x - (stand_x + 18)) - (y - 180) * 84 / 180) < 2 and 180 < y < 360
        leg_right = abs((x - (stand_x + 102)) + (y - 180) * 84 / 180) < 2 and 180 < y < 360
        if is_sign_edge or leg_left or leg_right:
            r, g, b = 185, 137, 50

    return r, g, b


def main() -> None:
    width, height = 1200, 520
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            row.extend(color_at(x, y, width, height))
        rows.append(bytes(row))

    raw = b"".join(rows)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(png)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
