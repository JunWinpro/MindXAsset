from PIL import Image
import glob
import math

files = sorted(glob.glob('frontend/public/assets/monster/*.png'))
files = [f for f in files if 'blue' in f or 'nose' in f or 'mouth' in f]
n = len(files)
cols = 10
rows = math.ceil(n / cols)

bg = Image.new('RGBA', (cols * 100, rows * 100), (200, 200, 200, 255))
x, y = 0, 0
for f in files:
    img = Image.open(f).convert('RGBA')
    bg.paste(img, (x, y), img)
    x += 100
    if x >= cols * 100:
        x = 0
        y += 100

bg.save('test_all.png')
