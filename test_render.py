from PIL import Image

def render():
    bg = Image.new('RGBA', (300, 300), (255, 255, 255, 255))
    
    body = Image.open('frontend/public/assets/monster/body_blueA.png').convert('RGBA')
    arm_L = Image.open('frontend/public/assets/monster/arm_blueA.png').convert('RGBA')
    arm_R = Image.open('frontend/public/assets/monster/arm_blueA.png').convert('RGBA').transpose(Image.FLIP_LEFT_RIGHT)
    
    # Body center at 150, 150. body is 165x165. top-left is 150-82 = 68
    body_pos = (68, 68)
    
    # Arm L: position 10, 80 relative to body top-left
    # Pivot: 0.5, 0.1
    pX, pY = int(arm_L.width * 0.5), int(arm_L.height * 0.1)
    arm_L_pos = (body_pos[0] + 10 - pX, body_pos[1] + 80 - pY)
    
    # Arm R: position 155, 80
    pX_R, pY_R = int(arm_R.width * 0.5), int(arm_R.height * 0.1)
    arm_R_pos = (body_pos[0] + 155 - pX_R, body_pos[1] + 80 - pY_R)
    
    # Paste
    bg.paste(arm_L, arm_L_pos, arm_L)
    bg.paste(body, body_pos, body)
    bg.paste(arm_R, arm_R_pos, arm_R)
    
    # Save
    bg.save('test_render.png')

render()
