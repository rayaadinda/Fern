from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import uvicorn
from PyPDF2 import PdfReader
from io import BytesIO
import re
from google.cloud import vision
import os
from typing import List, Optional
from google.oauth2 import service_account

# Define maximum file size (20MB in bytes)
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
MAX_CHUNK_SIZE = 500  # Reduced chunk size for better processing

# Initialize Google Cloud Vision client with explicit credentials
try:
    credentials = service_account.Credentials.from_service_account_file(
        'vision-credentials.json')
    vision_client = vision.ImageAnnotatorClient(credentials=credentials)
except Exception as e:
    print(f"Error loading credentials: {str(e)}")
    print("Please ensure vision-credentials.json is in the backend directory")
    raise

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading summarization model... This might take a few minutes on first run.")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
print("Model loaded successfully!")

class Document(BaseModel):
    text: str

class ImageAnalysisResponse(BaseModel):
    labels: List[str]
    text: Optional[str]
    faces: List[dict]
    objects: List[dict]
    safe_search: dict

def clean_text(text: str) -> str:
    """Clean and normalize text."""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep periods and basic punctuation
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    # Normalize line endings
    text = text.replace('\r', '\n')
    # Remove multiple newlines
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

def split_text_into_chunks(text: str, chunk_size: int = MAX_CHUNK_SIZE) -> list[str]:
    """Split text into smaller, meaningful chunks."""
    # Clean the text first
    text = clean_text(text)
    
    # Split by paragraphs first
    paragraphs = text.split('\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If paragraph is too long, split by sentences
        if len(paragraph) > chunk_size:
            # Split into sentences
            sentences = re.split(r'(?<=[.!?])\s+', paragraph)
            for sentence in sentences:
                if len(sentence.strip()) == 0:
                    continue
                    
                if len(current_chunk) + len(sentence) <= chunk_size:
                    current_chunk += sentence + " "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
        else:
            if len(current_chunk) + len(paragraph) <= chunk_size:
                current_chunk += paragraph + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return [chunk for chunk in chunks if len(chunk.strip()) > 50]  # Only keep meaningful chunks

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract and clean text from PDF."""
    try:
        pdf = PdfReader(BytesIO(file_bytes))
        text_parts = []
        
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                # Clean the extracted text
                text = clean_text(text)
                text_parts.append(text)
        
        return "\n".join(text_parts)
    except Exception as e:
        print(f"PDF extraction error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def summarize_text(text: str, filename: str = "") -> str:
    """Summarize text by processing it in chunks."""
    try:
        chunks = split_text_into_chunks(text)
        if not chunks:
            raise HTTPException(status_code=400, detail="No valid text content found to summarize")
        
        # Process each chunk
        summaries = []
        for chunk in chunks:
            if len(chunk.strip()) < 50:  # Skip very short chunks
                continue
                
            try:
                summary = summarizer(chunk, max_length=150, min_length=30, do_sample=False)
                summaries.append(summary[0]["summary_text"])
            except Exception as e:
                print(f"Error summarizing chunk: {str(e)}")
                continue
        
        if not summaries:
            raise HTTPException(status_code=400, detail="Could not generate summary")
        
        # Combine summaries
        final_text = " ".join(summaries)
        
        # Format the final summary
        if filename:
            return f"Summary of {filename}:\n\n{final_text}"
        return final_text
        
    except Exception as e:
        print(f"Summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")

@app.post("/api/summarize")
async def summarize_document(document: Document):
    try:
        if not document.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        return {"summary": summarize_text(document.text)}
    except Exception as e:
        print(f"Error during summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")

@app.post("/api/summarize-pdf")
async def summarize_pdf(file: UploadFile = File(...)):
    try:
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size must be less than 20MB")
            
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
            
        # Extract and clean text
        text = extract_text_from_pdf(contents)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
        # Generate summary
        summary = summarize_text(text, file.filename)
        return {"summary": summary}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size must be less than 20MB")

        # Create vision image object
        image = vision.Image(content=contents)
        
        # Perform multiple detection operations
        label_detection = vision_client.label_detection(image=image)
        text_detection = vision_client.text_detection(image=image)
        face_detection = vision_client.face_detection(image=image)
        object_detection = vision_client.object_localization(image=image)
        safe_search = vision_client.safe_search_detection(image=image)

        # Process labels
        labels = [label.description for label in label_detection.label_annotations]

        # Process text
        text = text_detection.text_annotations[0].description if text_detection.text_annotations else ""

        # Process faces
        faces = []
        for face in face_detection.face_annotations:
            faces.append({
                "confidence": face.detection_confidence,
                "joy": face.joy_likelihood.name,
                "sorrow": face.sorrow_likelihood.name,
                "anger": face.anger_likelihood.name,
                "surprise": face.surprise_likelihood.name,
                "bounds": {
                    "left": face.bounding_poly.vertices[0].x,
                    "top": face.bounding_poly.vertices[0].y,
                    "right": face.bounding_poly.vertices[2].x,
                    "bottom": face.bounding_poly.vertices[2].y
                }
            })

        # Process objects
        objects = []
        for obj in object_detection.localized_object_annotations:
            objects.append({
                "name": obj.name,
                "confidence": obj.score,
                "bounds": {
                    "left": obj.bounding_poly.normalized_vertices[0].x,
                    "top": obj.bounding_poly.normalized_vertices[0].y,
                    "right": obj.bounding_poly.normalized_vertices[2].x,
                    "bottom": obj.bounding_poly.normalized_vertices[2].y
                }
            })

        # Process safe search
        safe_search_dict = {
            "adult": safe_search.safe_search_annotation.adult.name,
            "violence": safe_search.safe_search_annotation.violence.name,
            "racy": safe_search.safe_search_annotation.racy.name,
            "spoof": safe_search.safe_search_annotation.spoof.name
        }

        return ImageAnalysisResponse(
            labels=labels,
            text=text,
            faces=faces,
            objects=objects,
            safe_search=safe_search_dict
        )

    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

if __name__ == "__main__":
    print("Starting server at http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)