from fastapi import FastAPI
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

#now instead of just returning a string i want to take the image and return it to the user

@app.get("/api/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

@app.post("/api/py/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read the file content
        contents = await file.read()
        
        # Here you would process the image
        # For now, we'll just return success
        
        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "content_type": file.content_type,
            "message": "Image received successfully"
        })
    except Exception as e:
        return JSONResponse({
            "success": False,
            "message": str(e)
        }, status_code=500)