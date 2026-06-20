from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from services.groq_service import generate_response
from utils.storage import save_chat, load_chat_history

# Initialize the FastAPI Router
router = APIRouter()

class ChatRequest(BaseModel):
    message: str = Field(..., description="Message content from user")

@router.post("/chat")
def chat(payload: ChatRequest):
    """
    Handles chat messages submitted via POST.
    Validates request payload, triggers LLM generation, saves conversation logs,
    and returns assistant responses in JSON format matching the original design.
    """
    user_message = payload.message.strip()

    # Validate that message is not blank
    if not user_message:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Bad Request: 'message' content cannot be blank or empty"}
        )

    try:
        # Generate response from Groq Llama 4
        ai_response = generate_response(user_message)
        
        # Log conversation locally in chat_history.json
        save_chat(user_message, ai_response)

        # Return success response
        return {"response": ai_response}

    except ValueError as ve:
        # Capture configuration and bad-request validation issues (e.g. missing API keys)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(ve)}
        )
    except RuntimeError as re:
        # Capture API connection, timeouts and library errors
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"error": str(re)}
        )
    except Exception as e:
        # Catch unexpected crash situations
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Internal Server Error: {str(e)}"}
        )


@router.get("/chat/history")
def get_history():
    """
    Exposes chat logs for the UI to reconstruct messages upon reload.
    """
    try:
        history = load_chat_history()
        return history
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Failed to retrieve chat history: {str(e)}"}
        )
