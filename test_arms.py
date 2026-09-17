from PIL import Image
import glob

bg = Image.new('RGBA', (500, 200), (255, 255, 255, 255))
x = 0
for f in sorted(glob.glob('frontend/public/assets/monster/arm_blue*.png')):
    img = Image.open(f).convert('RGBA')
    bg.paste(img, (x, 0), img)
    x += 100

bg.save('test_arms.png')
