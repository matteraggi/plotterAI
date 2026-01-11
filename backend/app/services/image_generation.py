from openai import AsyncOpenAI
import base64
import time
import os
from app.core.config import settings
from app.core.prompts import PLOTTER_SYSTEM_PROMPT, PRESET_SIMPLE, PRESET_COMPLEX

class ImageGenerationService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-image-1-mini"

    async def generate_image(self, prompt: str, complexity: str = "simple") -> str:
        preset_prompt = PRESET_SIMPLE if complexity == "simple" else PRESET_COMPLEX
        full_prompt = f"{PLOTTER_SYSTEM_PROMPT}\nDensity: {preset_prompt}\nSubject to draw: {prompt}"
        
        try:
            response = await self.client.images.generate(
                model=self.model,
                prompt=full_prompt,
                n=1,
                size="1024x1024"
            )
            
            image_url = response.data[0].url
            
            # Handle base64 response if URL is missing
            if image_url is None and response.data[0].b64_json:
                timestamp = int(time.time() * 1000)
                filename = f"generated_{timestamp}.png"
                file_path = os.path.join("app/static", filename)
                
                image_data = base64.b64decode(response.data[0].b64_json)
                with open(file_path, "wb") as f:
                    f.write(image_data)
                
                return f"/static/{filename}"
            
            return image_url
        except Exception as e:
            print(f"Error generating image: {e}")
            raise e

image_generation_service = ImageGenerationService()
