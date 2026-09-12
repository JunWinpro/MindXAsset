import os
import shutil

SOURCE_DIR = r"c:\Users\junde\OneDrive\Desktop\TranKhoi\repotest\MindX\DuAn\MindXAsset\CharacterManaJ_0.9.9.9b8\characters\pipoya32x32_characters"
DEST_DIR = r"c:\Users\junde\OneDrive\Desktop\TranKhoi\repotest\MindX\DuAn\MindXAsset\frontend\public\assets\pipoya"

MAPPING = {
    "00Skin": ("bases", False),
    "01Costume": ("tops", False),
    "02Eye": ("eyes", False),
    "03Hair": ("hairs", False),
    "03Hair$": ("hairs", True),
    "03HairHat": ("hairhats", False),
    "03HairHat$": ("hairhats", True),
    "04HairAdd": ("hairadds", False),
    "04HairAdd$": ("hairadds", True),
    "05Hat": ("hats", False),
    "05Hat$": ("hats", True),
    "06Glasses": ("glasses", False),
    "07Cloak": ("cloaks", False),
    "07Cloak$": ("cloaks", True),
    "08Makeup": ("makeup", False),
    "09Beard": ("beards", False),
    "10Ear": ("ears", False),
    "10Ear$": ("ears", True),
    "11Tail": ("tails", False),
    "11Tail$": ("tails", True),
    "12Item": ("items", False),
    "12Item$": ("items", True),
    "13Shadow": ("shadows", False)
}

def extract_assets():
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)

    for folder_name, (prefix, is_back_layer) in MAPPING.items():
        folder_path = os.path.join(SOURCE_DIR, folder_name)
        if not os.path.exists(folder_path):
            continue
        
        dest_sub_dir = os.path.join(DEST_DIR, prefix)
        if not os.path.exists(dest_sub_dir):
            os.makedirs(dest_sub_dir)

        files = [f for f in os.listdir(folder_path) if f.endswith('.png')]
        files.sort()
        
        suffix = "_back" if is_back_layer else ""
        
        for i, filename in enumerate(files):
            new_filename = f"{prefix}_{i+1:03d}{suffix}.png"
            src_file = os.path.join(folder_path, filename)
            dst_file = os.path.join(dest_sub_dir, new_filename)
            shutil.copy2(src_file, dst_file)

if __name__ == "__main__":
    extract_assets()
    print("Xong!")
