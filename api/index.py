from fastapi import FastAPI
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import asyncio
import base64
import os

### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

#now instead of just returning a string i want to take the image and return it to the user

@app.get("/api/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

@app.post("/api/py/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read the example image from public directory
        example_path = os.path.join(os.path.dirname(__file__), '../public/example1.png')
        
        with open(example_path, 'rb') as f:
            example_contents = f.read()
        
        # Simulate processing time
        await asyncio.sleep(5)
        
        # Convert example image to base64
        base64_image = base64.b64encode(example_contents).decode('utf-8')
        
        return JSONResponse({
            "success": True,
            "message": "Image processed successfully",
            "processedImage": f"data:image/png;base64,{base64_image}"
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "message": str(e)
        }, status_code=500)