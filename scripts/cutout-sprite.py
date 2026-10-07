"""Cut a game sprite out of a generated image on a plain white background.

Usage: python3 scripts/cutout-sprite.py <input> <output.png> <width> [anchorX anchorY]

Flood-fills the white background from the image border (so white details
inside the character survive), feathers the edge, crops to the character and
resizes to <width>. With an anchor point in input pixels, prints where it
lands as a fraction of the output, for positioning the sprite on its hitbox.
"""
import sys
from collections import deque

from PIL import Image, ImageFilter

THRESHOLD = 228


def is_background(pixel):
    r, g, b = pixel[:3]
    return r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD


def main():
    src, dst, width = sys.argv[1], sys.argv[2], int(sys.argv[3])
    anchor = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else None

    image = Image.open(src).convert('RGBA')
    w, h = image.size
    pixels = image.load()
    background = bytearray(w * h)
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
        if background[i] or not is_background(pixels[x, y]):
            continue
        background[i] = 1
        if x > 0: queue.append((x - 1, y))
        if x < w - 1: queue.append((x + 1, y))
        if y > 0: queue.append((x, y - 1))
        if y < h - 1: queue.append((x, y + 1))

    mask = Image.new('L', (w, h), 255)
    mask_pixels = mask.load()
    for y in range(h):
        for x in range(w):
            if background[y * w + x]:
                mask_pixels[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    image.putalpha(mask)

    box = mask.point(lambda v: 255 if v > 24 else 0).getbbox()
    cropped = image.crop(box)
    height = round(cropped.height * width / cropped.width)
    cropped.resize((width, height), Image.LANCZOS).save(dst, optimize=True)

    print(f'crop={box} size={width}x{height}')
    if anchor:
        ax = (anchor[0] - box[0]) / (box[2] - box[0])
        ay = (anchor[1] - box[1]) / (box[3] - box[1])
        print(f'anchor=({ax:.3f}, {ay:.3f}) aspect={cropped.height / cropped.width:.3f}')


if __name__ == '__main__':
    main()
