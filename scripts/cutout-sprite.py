"""Cut a game sprite out of a generated image on a plain white background.

Usage: python3 scripts/cutout-sprite.py <input> <output> <width> [--flip]

Flood-fills the white background from the image border, so white details
inside the character survive. Pixels reached by the fill keep their colour
with white removed ("colour to alpha"), which turns soft glows and smoke into
translucent edges instead of solid halos. The result is cropped to the
character, optionally mirrored, resized to <width> and saved (PNG or WebP by
extension). Prints the output size for sizing the sprite in the game.
"""
import sys
from collections import deque

from PIL import Image, ImageFilter

# A pixel is background-ish when white-removal would leave it at most this opaque.
FLOOD_ALPHA = 0.45
POCKET_MIN_PIXELS = 400


def white_alpha(r, g, b):
    return (255 - min(r, g, b)) / 255


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flip = '--flip' in sys.argv
    src, dst, width = args[0], args[1], int(args[2])

    image = Image.open(src).convert('RGBA')
    w, h = image.size
    pixels = image.load()
    reached = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if reached[i]:
            continue
        r, g, b, _ = pixels[x, y]
        if white_alpha(r, g, b) > FLOOD_ALPHA:
            continue
        reached[i] = 1
        if x > 0: queue.append((x - 1, y))
        if x < w - 1: queue.append((x + 1, y))
        if y > 0: queue.append((x, y - 1))
        if y < h - 1: queue.append((x, y + 1))

    # White pockets enclosed by the character (between an arm and hair, say)
    # are background too, unless they are small enough to be eyes or teeth.
    seen = bytearray(w * h)
    for start in range(w * h):
        if reached[start] or seen[start]:
            continue
        sx, sy = start % w, start // w
        if white_alpha(*pixels[sx, sy][:3]) > 0.06:
            continue
        component = []
        queue.append((sx, sy))
        while queue:
            x, y = queue.popleft()
            i = y * w + x
            if seen[i] or reached[i] or white_alpha(*pixels[x, y][:3]) > FLOOD_ALPHA:
                continue
            seen[i] = 1
            component.append(i)
            if x > 0: queue.append((x - 1, y))
            if x < w - 1: queue.append((x + 1, y))
            if y > 0: queue.append((x, y - 1))
            if y < h - 1: queue.append((x, y + 1))
        if len(component) > POCKET_MIN_PIXELS:
            for i in component:
                reached[i] = 1

    out = Image.new('RGBA', (w, h))
    out_pixels = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = pixels[x, y]
            if not reached[y * w + x]:
                out_pixels[x, y] = (r, g, b, 255)
                continue
            a = white_alpha(r, g, b)
            if a < 0.04:
                out_pixels[x, y] = (0, 0, 0, 0)
                continue
            un = lambda c: max(0, min(255, round((c - 255 * (1 - a)) / a)))
            out_pixels[x, y] = (un(r), un(g), un(b), round(a * 255))

    alpha = out.getchannel('A').filter(ImageFilter.GaussianBlur(0.6))
    out.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
    cropped = out.crop(box)
    if flip:
        cropped = cropped.transpose(Image.FLIP_LEFT_RIGHT)
    height = round(cropped.height * width / cropped.width)
    resized = cropped.resize((width, height), Image.LANCZOS)
    if dst.endswith('.webp'):
        resized.save(dst, 'WEBP', quality=88, method=6)
    else:
        resized.save(dst, optimize=True)
    print(f'{dst}: {width}x{height}')


if __name__ == '__main__':
    main()
