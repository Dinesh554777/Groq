import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Groq API Configuration
# Prioritize environment variables for production security, default to requested placeholder
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_API_KEY")

# Target Groq Model
MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"
