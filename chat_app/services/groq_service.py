from groq import Groq
from config import GROQ_API_KEY, MODEL_NAME
from prompts.system_prompt import SYSTEM_PROMPT

def generate_response(message):
    """
    Validates configuration and inputs, then calls Groq API with system prompt
    and user message using Llama 4 Scout.
    """
    # 1. API key validation
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_API_KEY":
        raise ValueError("Groq API Key is not configured. Please set GROQ_API_KEY in a .env file or config.py.")

    # 2. Input message validation
    if not message or not message.strip():
        raise ValueError("Message cannot be empty.")

    try:
        # 3. Initialize Groq client
        client = Groq(api_key=GROQ_API_KEY)

        # 4. Generate completions
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            # Optional parameters can be added here (e.g. temperature)
        )

        # 5. Extract and return text response
        if response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content
            if content:
                return content
            raise ValueError("Received empty content response from API.")
        else:
            raise RuntimeError("API returned response without choices.")

    except Exception as e:
        # Let parent route capture the custom error message
        raise RuntimeError(f"Groq API Error: {str(e)}")
