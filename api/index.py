from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from .outpainting import process_uploaded_image

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

@app.post("/api/py/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Process the image using the outpainting logic
        base64_image = process_uploaded_image(contents)
        
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