"""Decode, bound and re-encode raster images; never serve uploaded source bytes."""
from io import BytesIO
import warnings
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 20_000_000

def normalize_poster(content):
    if not content or len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, 'حداکثر اندازه تصویر پنج مگابایت است.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as source:
                if source.format not in ('JPEG', 'PNG', 'WEBP'):
                    raise HTTPException(415, 'فقط تصویر واقعی با قالب‌های مجاز پذیرفته می‌شود.')
                if source.width * source.height > MAX_PIXELS:
                    raise HTTPException(413, 'ابعاد تصویر بیش از حد مجاز است.')
                if getattr(source, 'n_frames', 1) != 1:
                    raise HTTPException(415, 'تصویر متحرک پذیرفته نمی‌شود.')
                source.load()
                image = ImageOps.exif_transpose(source).convert('RGB')
                image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
                # Fresh image has no source EXIF, text, location, or ICC metadata.
                clean = Image.new('RGB', image.size); clean.paste(image)
                output = BytesIO(); clean.save(output, format='WEBP', quality=85)
                return output.getvalue(), clean.width, clean.height
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(413, 'ابعاد تصویر بیش از حد مجاز است.')
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(415, 'فایل تصویر سالم و قابل خواندن نیست.')
