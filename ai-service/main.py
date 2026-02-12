from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from gtts import gTTS
import speech_recognition as sr
import io
import cv2
import numpy as np
from PIL import Image
import base64

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextToSpeechRequest(BaseModel):
    text: str
    lang: str = "en"

@app.get("/")
def read_root():
    return {"message": "AI Service is running! 🤖"}

@app.post("/tts")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech and return audio file
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # Create TTS object
        tts = gTTS(text=request.text, lang=request.lang, slow=False)

        # Save to bytes buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        # Return as streaming response
        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")

@app.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Convert speech to text from audio file
    """
    try:
        # Read audio file
        audio_data = await audio.read()

        # Save to temporary file-like object
        audio_buffer = io.BytesIO(audio_data)

        # Initialize recognizer
        recognizer = sr.Recognizer()

        # Load audio from buffer
        with sr.AudioFile(audio_buffer) as source:
            audio_content = recognizer.record(source)

        # Recognize speech using Google Speech Recognition
        text = recognizer.recognize_google(audio_content)

        return {
            "success": True,
            "text": text,
            "confidence": 1.0
        }
    except sr.UnknownValueError:
        return {
            "success": False,
            "text": "",
            "error": "Could not understand audio"
        }
    except sr.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Speech recognition service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT Error: {str(e)}")

@app.post("/analyze-face")
async def analyze_face(image: UploadFile = File(...)):
    """
    Analyze face from image frame for emotion, eye contact, and confidence
    """
    try:
        # Read image
        image_data = await image.read()
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        # Initialize results
        result = {
            "face_detected": False,
            "emotion": "neutral",
            "confidence_score": 0,
            "eye_contact": False,
            "suggestions": []
        }

        # Load face detection cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

        # Convert to grayscale for detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) > 0:
            result["face_detected"] = True

            # Get first face
            (x, y, w, h) = faces[0]

            # Detect eyes within face region
            roi_gray = gray[y:y+h, x:x+w]
            eyes = eye_cascade.detectMultiScale(roi_gray)

            # Eye contact detection (if both eyes visible)
            if len(eyes) >= 2:
                result["eye_contact"] = True
                result["confidence_score"] += 30
            elif len(eyes) == 1:
                result["eye_contact"] = False
                result["confidence_score"] += 10
                result["suggestions"].append("Try to look directly at the camera")
            else:
                result["eye_contact"] = False
                result["suggestions"].append("Face the camera more directly")

            # Calculate confidence based on face size (larger = closer to camera = more confident)
            face_area = w * h
            frame_area = img.shape[0] * img.shape[1]
            face_ratio = face_area / frame_area

            if face_ratio > 0.15:  # Face takes up good portion of frame
                result["confidence_score"] += 40
                result["emotion"] = "confident"
            elif face_ratio > 0.08:
                result["confidence_score"] += 25
                result["emotion"] = "neutral"
            else:
                result["confidence_score"] += 10
                result["emotion"] = "nervous"
                result["suggestions"].append("Move closer to the camera")

            # Face position (centered is better)
            frame_center_x = img.shape[1] / 2
            face_center_x = x + w / 2
            offset_ratio = abs(face_center_x - frame_center_x) / frame_center_x

            if offset_ratio < 0.2:  # Well centered
                result["confidence_score"] += 30
            elif offset_ratio < 0.4:
                result["confidence_score"] += 15
            else:
                result["suggestions"].append("Center yourself in the frame")

            # Cap confidence at 100
            result["confidence_score"] = min(result["confidence_score"], 100)

        else:
            result["suggestions"].append("No face detected - please face the camera")

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face analysis error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
