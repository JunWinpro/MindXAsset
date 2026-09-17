from PIL import Image
import glob

bg = Image.new('RGBA', (800, 200), (200, 200, 200, 255))
x = 0
for f in sorted(glob.glob('frontend/public/assets/monster/detail_blue*.png')):
    img = Image.open(f).convert('RGBA')
    bg.paste(img, (x, 50), img)
    x += 100

bg.save('test_details.png')
