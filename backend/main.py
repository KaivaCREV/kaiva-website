from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
) 

@app.post("/abstract-lease")
async def create_lease_abstract(file: UploadFile = File(...)):
    try:
        logger.info(f"Received file: {file.filename}")
        # Save file temporarily
        contents = await file.read()
        logger.info(f"File size: {len(contents)} bytes")
        
        # Your processing logic here
        # For now, just return success to test the endpoint
        return {
            "status": "success",
            "filename": file.filename,
            "download_url": "/downloads/test.xlsx"
        }
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return {"error": str(e)}

# Add a test GET endpoint
@app.get("/")
async def root():
    return {"message": "API is running"} 