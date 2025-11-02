# # backend/apis/tts_api.py
# import os
# from io import BytesIO
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel, Field
# from dotenv import load_dotenv
# from elevenlabs.client import ElevenLabs

# load_dotenv()
# router = APIRouter()

# class TTSRequest(BaseModel):
#     text: str = Field(min_length=1, max_length=5000)
#     voice_id: str | None = None           # optional override
#     model_id: str | None = "eleven_multilingual_v2"
#     output_format: str | None = "mp3_44100_128"

# # Optional: set a default voice for each language
# VOICE_BY_LANG = {
#     "English": "21m00Tcm4TlvDq8ikWAM",     # Rachel (example)
#     "Hindi":   "TZXnHeB62zELHhRDHuu1",     # replace with your voice
#     "Marathi": "TZXnHeB62zELHhRDHuu1",     # replace with your voice
# }

# @router.post("/tts")
# def text_to_speech(req: TTSRequest):
#     api_key = os.getenv("ELEVENLABS_API_KEY")
#     if not api_key:
#         raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured.")

#     client = ElevenLabs(api_key=api_key)

#     try:
#         # pick a voice
#         voice_id = req.voice_id or VOICE_BY_LANG.get("English")  # default
#         # Generate audio (bytes iterator)
#         audio_iter = client.text_to_speech.convert(
#             text=req.text,
#             voice_id=voice_id,
#             model_id=req.model_id or "eleven_multilingual_v2",
#             output_format=req.output_format or "mp3_44100_128",
#         )

#         # The SDK returns a generator/iterator of bytes – stream it back
#         return StreamingResponse(
#             audio_iter,            # iterator of bytes
#             media_type="audio/mpeg",
#             headers={
#                 "Content-Disposition": "inline; filename=tts.mp3"
#             },
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"TTS failed: {e}")
