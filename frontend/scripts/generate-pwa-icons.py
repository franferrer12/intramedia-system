#!/usr/bin/env python3
"""
Script para generar iconos PWA en múltiples tamaños
Requiere: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Tamaños de iconos PWA
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Colores del tema
BG_COLOR = "#2563eb"  # Blue-600
TEXT_COLOR = "#ffffff"

def create_icon(size):
    """Crea un icono con el tamaño especificado"""
    # Crear imagen con fondo azul
    img = Image.new('RGB', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Calcular tamaño del texto proporcional al icono
    font_size = int(size * 0.4)

    # Intentar usar una fuente del sistema
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

    # Texto del icono
    text = "POS"

    # Calcular posición centrada
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]

    # Dibujar texto
    draw.text((x, y), text, fill=TEXT_COLOR, font=font)

    # Agregar borde redondeado
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = int(size * 0.15)
    mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)

    # Aplicar máscara
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)

    return output

def main():
    # Crear directorio de iconos
    icons_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    print("🎨 Generando iconos PWA...")

    for size in SIZES:
        icon = create_icon(size)
        filename = f"icon-{size}x{size}.png"
        filepath = os.path.join(icons_dir, filename)
        icon.save(filepath, 'PNG')
        print(f"✅ {filename} creado")

    print(f"\n✨ {len(SIZES)} iconos generados en {icons_dir}")
    print("\nPara producción, considera reemplazar estos iconos con diseños profesionales.")

if __name__ == "__main__":
    main()
