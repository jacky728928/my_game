import urllib.request
import urllib.parse
import os
import time

pic_dir = r'd:\Program Files\python work\游戏最新（自己）\test_project\pic'

portraits = [
    ("portrait_01.png", "portrait of a young female warrior, anime pixel art style, short silver hair, blue eyes, futuristic sci-fi armor with glowing blue lines, holding energy sword, black background, 2D sprite, chibi pixel portrait, game character, clean pixel art"),
    ("portrait_02.png", "portrait of a young male soldier, anime pixel art style, black tactical helmet, goggles, black tactical uniform, holding futuristic energy gun, black background, 2D sprite, chibi pixel portrait"),
    ("portrait_03.png", "portrait of a magical girl, anime pixel art style, long pink hair in twin tails, pink and white frilly magical dress, holding glowing star staff, black background, 2D sprite, chibi pixel portrait"),
    ("portrait_04.png", "portrait of a young male mage, anime pixel art style, long dark blue robe with gold trim, glowing magic circle behind him, holding golden staff, black background, 2D sprite"),
    ("portrait_05.png", "portrait of a female mecha pilot, anime pixel art style, long red hair ponytail, pink bodysuit with white accents, headset goggles on forehead, black background, 2D sprite"),
    ("portrait_06.png", "portrait of a male paladin knight, anime pixel art style, short blonde hair, shining silver plate armor with gold trim, red cape, holding holy sword, black background, 2D sprite"),
    ("portrait_07.png", "portrait of a dark witch female, anime pixel art style, long purple black hair, dark purple cloak with hood, holding glowing crystal ball, purple magic aura, black background"),
    ("portrait_08.png", "portrait of a male ninja assassin, anime pixel art style, black hood mask with red eyes, dark ninja outfit, throwing shuriken, black background, 2D sprite"),
    ("portrait_09.png", "portrait of a female mechanic android girl, anime pixel art style, twin tails brown hair, oil-stained overalls crop top, mechanical arm gear accessories, black background"),
    ("portrait_10.png", "portrait of a male alchemist rune master, anime pixel art style, messy brown hair, brown leather vest with rune tattoos on arms, holding glowing green flask, black background"),
]

url_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

for filename, prompt in portraits:
    encoded = urllib.parse.quote(prompt)
    url = f"{url_base}?prompt={encoded}&image_size=portrait_4_3"
    print(f"[{time.strftime('%H:%M:%S')}] Generating {filename}...")
    try:
        req = urllib.request.urlopen(url, timeout=120)
        data = req.read()
        path = os.path.join(pic_dir, filename)
        with open(path, 'wb') as f:
            f.write(data)
        print(f"  Saved {len(data)} bytes")
    except Exception as e:
        print(f"  Error: {e}")
    time.sleep(3)

print("\nAll 10 portraits generated successfully!")
