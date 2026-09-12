import os
import json

ASSETS_DIR = r"c:\Users\junde\OneDrive\Desktop\TranKhoi\repotest\MindX\DuAn\MindXAsset\frontend\public\assets\pipoya"
OUTPUT_FILE = r"c:\Users\junde\OneDrive\Desktop\TranKhoi\repotest\MindX\DuAn\MindXAsset\frontend\src\pages\CharacterBuilder\assets_config.js"

# Z-index mapping based on character.xml from pipoya
Z_INDEX_MAP = {
    "shadows": (0, 0),
    "tails": (15, 25), # back tail, front tail
    "bases": (200, 200),
    "eyes": (250, 250),
    "makeup": (260, 260),
    "beards": (270, 270),
    "ears": (280, 285),
    "tops": (300, 300), # costumes
    "cloaks": (400, 50), # front cloak, back cloak
    "hairs": (465, 45), # front hair, back hair
    "hairadds": (470, 46), # front hair add, back hair add
    "hats": (500, 40), # front hat, back hat
    "glasses": (550, 550),
    "items": (600, 10) # front item, back item
}

CATEGORY_LABELS = {
    "bases": "Thân",
    "eyes": "Mắt",
    "hairs": "Tóc",
    "tops": "Trang phục",
    "bottoms": "Quần",
    "shoes": "Giày",
    "hats": "Mũ/Nón",
    "glasses": "Mắt kính",
    "ears": "Tai",
    "tails": "Đuôi",
    "items": "Vật phẩm",
    "cloaks": "Áo choàng",
    "beards": "Râu",
    "hairadds": "Phụ kiện tóc",
    "makeup": "Trang điểm"
}

def generate_config():
    config = {}
    for cat in Z_INDEX_MAP.keys():
        cat_dir = os.path.join(ASSETS_DIR, cat)
        if not os.path.exists(cat_dir):
            continue
            
        files = os.listdir(cat_dir)
        front_files = [f for f in files if not f.endswith("_back.png")]
        
        options = []
        options.append({
            "id": f"{cat}_none",
            "name": "Không có",
            "type": cat,
            "layers": []
        })
        
        z_front, z_back = Z_INDEX_MAP[cat]
        label = CATEGORY_LABELS.get(cat, cat)
        
        for i, front_file in enumerate(front_files):
            num_str = front_file.split("_")[1].split(".")[0]
            back_file = f"{cat}_{num_str}_back.png"
            
            layers = [{"src": f"/assets/pipoya/{cat}/{front_file}", "z_index": z_front}]
            if back_file in files:
                layers.append({"src": f"/assets/pipoya/{cat}/{back_file}", "z_index": z_back})
                
            options.append({
                "id": f"{cat}_{num_str}",
                "name": f"{label} {i+1}",
                "type": cat,
                "layers": layers
            })
            
        config[cat] = options

    # Mock empty arrays for bottoms and shoes
    config["bottoms"] = [{"id": "bot_none", "name": "Theo trang phục", "type": "bottoms", "layers": []}]
    config["shoes"] = [{"id": "shoe_none", "name": "Theo trang phục", "type": "shoes", "layers": []}]

    js_code = """// ============================================================
// AUTO GENERATED ASSET CONFIGURATION
// ============================================================

const defaultPalettes = [
  { name: 'Gốc (Không màu)', hex: '#ffffff' },
  { name: 'Đen xám', hex: '#4d4d4d' },
  { name: 'Đỏ MindX', hex: '#dc2626' },
  { name: 'Cam đất', hex: '#c2410c' },
  { name: 'Vàng ươm', hex: '#ca8a04' },
  { name: 'Xanh lá', hex: '#16a34a' },
  { name: 'Xanh ngọc', hex: '#0d9488' },
  { name: 'Xanh dương', hex: '#2563eb' },
  { name: 'Tím nhạt', hex: '#9333ea' },
  { name: 'Hồng phấn', hex: '#db2777' },
  { name: 'Nâu sậm', hex: '#78350f' },
  { name: 'Trắng tinh', hex: '#f8fafc' }
];

export const colorPalettes = {
  bases: defaultPalettes,
  hairs: defaultPalettes,
  tops: defaultPalettes,
  bottoms: defaultPalettes,
  shoes: defaultPalettes,
  accessories: defaultPalettes,
  eyes: defaultPalettes,
  hats: defaultPalettes,
  glasses: defaultPalettes,
  items: defaultPalettes,
  cloaks: defaultPalettes,
  beards: defaultPalettes,
  ears: defaultPalettes,
  tails: defaultPalettes,
  hairadds: defaultPalettes,
  makeup: defaultPalettes
};

export const assetConfig = """ + json.dumps(config, indent=2) + """;

export const getLayerSource = (category, optionId) => {
  if (!optionId || optionId.endsWith('_none')) return [];
  const optionsList = assetConfig[category] || [];
  const selectedOpt = optionsList.find(opt => opt.id === optionId);
  if (selectedOpt && selectedOpt.layers) {
    return selectedOpt.layers;
  }
  return [];
};
"""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_code)
    
if __name__ == "__main__":
    generate_config()
    print("Xong assets_config.js!")
