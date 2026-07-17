from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import base64
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MindX Asset Generator FastAPI")

class ImageRequest(BaseModel):
    prompt: str
    model: str = "flux"
    assetType: str = ""
    artStyle: str = ""
    perspective: str = ""
    transparent: bool = False

@app.post("/api/generate-image")
async def generate_image(req: ImageRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp prompt")
    
    final_prompt = f"{req.prompt}, {req.assetType}, {req.artStyle} style, {req.perspective} perspective"
    encoded_prompt = urllib.parse.quote(final_prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?model={req.model}"
    
    if req.transparent:
        url += "&transparent=true"
        
    api_key = os.getenv("POLLINATIONS_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            base64_image = base64.b64encode(response.content).decode('utf-8')
            return {"image": f"data:image/jpeg;base64,{base64_image}"}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Lỗi từ API Pollinations")

if __name__ == "__main__":
    import uvicorn
    # Cấu hình port 5000 để chạy song song hoặc thay thế hoàn toàn Backend cũ
    uvicorn.run(app, host="0.0.0.0", port=5000)
