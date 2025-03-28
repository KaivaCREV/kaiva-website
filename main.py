# main.py – FastAPI backend with logger-based debugging (OpenAI SDK v1 compatible)

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import openai
import pandas as pd
import os
import uuid
from dotenv import load_dotenv
import logging
import json
import ast

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables first
load_dotenv()

# Get API key and verify it's loaded
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OPENAI_API_KEY not found in environment variables!")
    raise ValueError("OPENAI_API_KEY not set")
else:
    logger.debug(f"OPENAI API Key loaded: {api_key[:6]}...")

openai.api_key = api_key

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://kaiva.ai",       # Replace with your actual domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIELDS = [
    "Transaction Type", "Document Date", "Tenant Legal Name", "Guarantor(s)",
    "Landlord Legal Name", "Landlord Broker", "Tenant Broker", "Building Address",
    "Suite Number(s)", "Square Footage", "Effective Date", "Who pays for what expenses? Pro-Rata Share?",
    "Base Rent Schedule", "Percentage Rent", "Commencement Date", "Rent Commencement Date",
    "Expiration Date", "Lease Term", "Rent Increases", "Tenant Improvements / Tenant Improvement Allowance",
    "Free rent (concession)", "Renewal Option(s) to Extend", "Early Termination", "Rent Abatement",
    "Right to Sublet", "Security Deposit Amount", "Letter of Credit Amount", "Late Fee"
]

def extract_text_from_pdf(file: UploadFile) -> str:
    doc = fitz.open(stream=file.file.read(), filetype="pdf")
    return "\n".join([page.get_text() for page in doc])

async def extract_fields_with_gpt(text: str) -> dict:
    system_msg = """You are a commercial real estate lease analyst. Extract the following fields from the lease document: """ + ", ".join(FIELDS) + """. 
    Return ONLY a valid Python dictionary with field names as keys and clearly stated values. Use 'Not Stated' if absent.
    Format your response as a proper Python dictionary like this: {"Field1": "Value1", "Field2": "Value2"}"""

    try:
        client = openai.OpenAI()
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": text[:12000]}
            ],
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        logger.debug(f"GPT Response: {content[:200]}...")

        # Try multiple parsing methods
        try:
            # Try ast.literal_eval first (safer than eval)
            data = ast.literal_eval(content)
        except Exception as e1:
            logger.warning(f"ast.literal_eval failed: {e1}")
            try:
                # Try json.loads as backup
                data = json.loads(content)
            except Exception as e2:
                logger.warning(f"json.loads failed: {e2}")
                # If both fail, clean up the response and try again
                cleaned_content = content.strip()
                if cleaned_content.startswith("```") and cleaned_content.endswith("```"):
                    # Remove code blocks if present
                    cleaned_content = cleaned_content.split("```")[1]
                if cleaned_content.startswith("python"):
                    # Remove language identifier if present
                    cleaned_content = cleaned_content.replace("python", "", 1)
                cleaned_content = cleaned_content.strip()
                try:
                    data = ast.literal_eval(cleaned_content)
                except Exception as e3:
                    logger.error(f"All parsing attempts failed: {e3}")
                    return {"error": "Could not parse GPT response into dictionary"}

        # Validate the parsed data
        if not isinstance(data, dict):
            logger.error(f"Parsed data is not a dictionary: {type(data)}")
            return {"error": "GPT response is not in the correct format"}

        # Ensure all fields are present
        for field in FIELDS:
            if field not in data:
                data[field] = "Not Stated"

        return data

    except Exception as e:
        logger.exception("OpenAI API error")
        return {"error": str(e)}

def save_to_excel(data: dict) -> str:
    df = pd.DataFrame(data.items(), columns=["Field", "Extracted Detail"])
    os.makedirs("abstracts", exist_ok=True)
    path = f"abstracts/abstract_{uuid.uuid4().hex}.xlsx"
    df.to_excel(path, index=False)
    return path

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        logger.debug(f"🔹 Received file: {file.filename}")

        lease_text = extract_text_from_pdf(file)
        logger.debug(f"🔹 Lease text extracted. Length: {len(lease_text)} chars")
        logger.debug(f"First 200 chars:\n{lease_text[:200]}")

        extracted_data = await extract_fields_with_gpt(lease_text)
        if "error" in extracted_data:
            logger.error(f"❌ GPT extraction failed: {extracted_data['error']}")
            return {"error": extracted_data["error"]}

        logger.debug(f"✅ Extracted data: {json.dumps(extracted_data, indent=2)}")

        file_path = save_to_excel(extracted_data)
        logger.debug(f"✅ Saved abstract to: {file_path}")

        return {"download_url": f"/download/{os.path.basename(file_path)}"}

    except Exception as e:
        logger.exception("🔥 UNHANDLED EXCEPTION")
        return {"error": str(e)}

@app.get("/download/{filename}")
def download_file(filename: str):
    return FileResponse(
        path=f"abstracts/{filename}",
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
