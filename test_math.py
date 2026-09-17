from PIL import Image

def test_math():
    # Let's simulate the canvas math
    bg = Image.new('RGBA', (380, 380), (240, 240, 240, 255))
    
    body = Image.open('frontend/public/assets/monster/body_darkD.png').convert('RGBA')
    arm = Image.open('frontend/public/assets/monster/arm_blueC.png').convert('RGBA')
    armR = arm.transpose(Image.FLIP_LEFT_RIGHT)
    nose = Image.open('frontend/public/assets/monster/nose_red.png').convert('RGBA')
    
    width, height = 380, 380
    monsterScale = min((width * 0.75) / 200, (height * 0.75) / 250)
    
    offsetX = (width - 200 * monsterScale) / 2
    offsetY = (height - 250 * monsterScale) / 2
    
    def draw(img, pos, pivot, scaleX=1):
        sW, sH = img.size
        pX = pivot[0] * sW
        pY = pivot[1] * sH
        
        # Translate
        tX = offsetX + pos[0] * monsterScale
        tY = offsetY + pos[1] * monsterScale
        
        # We need to compute the top-left of the image in world space
        if scaleX == 1:
            drawX = tX - pX * monsterScale
            drawY = tY - pY * monsterScale
            bg.paste(img, (int(drawX), int(drawY)), img)
        else:
            # If scaleX == -1, the image is mirrored. 
            # In HTML5 Canvas, ctx.scale(-1, 1) around the translated origin (tX, tY)
            # then draw at (-pX * S, -pY * S).
            # This means the image's x=0 is at tX - (-pX * S) * -1 = tX + pX * S
            # Wait!
            # Let's trace a point (x, y) in the image.
            # It goes to (-pX * S + x * S, -pY * S + y * S) in flipped space.
            # In world space, X = tX - (-pX * S + x * S) = tX + pX * S - x * S
            # The top-left corner (x=0) goes to tX + pX * S.
            # Since PIL paste needs the top-left corner, but the image is flipped,
            # the top-left of the FLIPPED image corresponds to x = sW in the original image!
            # So in world space, x=sW goes to tX + pX * S - sW * S.
            drawX = tX + pX * monsterScale - sW * monsterScale
            drawY = tY - pY * monsterScale
            bg.paste(img, (int(drawX), int(drawY)), img)

    # Body D center 87, 91. 
    draw(body, (0, 0), (0, 0))
    
    # Arm L for D: {x: 10, y: 90}
    draw(arm, (10, 90), (0.5, 0.1), scaleX=-1)
    
    # Arm R for D: {x: 164, y: 90}
    draw(armR, (164, 90), (0.5, 0.1), scaleX=1)
    
    # Nose
    draw(nose, (87, 95), (0.5, 0.5))
    
    bg.save('test_math.png')

test_math()
