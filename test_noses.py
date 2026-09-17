from PIL import Image
import glob

bg = Image.new('RGBA', (500, 200), (200, 200, 200, 255))
x = 0
for f in sorted(glob.glob('frontend/public/assets/monster/nose*.png')) + sorted(glob.glob('frontend/public/assets/monster/snot*.png')):
    img = Image.open(f).convert('RGBA')
    bg.paste(img, (x, 50), img)
    x += 100

bg.save('test_noses.png')
