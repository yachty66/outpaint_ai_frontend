from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .outpainting import process_uploaded_image

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domain
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

@app.get("/api/py/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

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
        raise HTTPException(status_code=400, detail=str(e))