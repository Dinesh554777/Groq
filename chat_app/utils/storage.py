import os
import json
from datetime import datetime

# Define base and output directory paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
FILE_PATH = os.path.join(OUTPUT_DIR, "chat_history.json")

def load_chat_history():
    """
    Loads all saved messages from chat_history.json.
    Returns an empty list if file doesn't exist or is invalid JSON.
    """
    if not os.path.exists(FILE_PATH):
        return []
    try:
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except (json.JSONDecodeError, IOError):
        return []

def save_chat(user_message, ai_response):
    """
    Saves user query and assistant response with a timestamp.
    Creates outputs directory and chat_history.json automatically if they do not exist.
    """
    # Ensure the outputs directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load current history
    history = load_chat_history()
    
    # Build new chat record
    new_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user": user_message,
        "assistant": ai_response
    }
    
    history.append(new_entry)
    
    # Save back to file
    try:
        with open(FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Error saving chat history: {e}")
        return False
