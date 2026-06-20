import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from routes.chat_routes import router as chat_router

# Initialize FastAPI application
app = FastAPI(title="Llama 4 Scout Chat")

# Mount the static directory to serve CSS and JS assets
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure the Jinja2 template loader
templates = Jinja2Templates(directory="templates")

# Register the Chat APIRouter (exposes /chat and /chat/history)
app.include_router(chat_router)

@app.get("/")
def index(request: Request):
    """
    Renders the premium AI Chat web interface using Jinja2 templates.
    """
    return templates.TemplateResponse("index.html", {"request": request})

# if __name__ == "__main__":
#     # Listens on http://127.0.0.1:5000 and auto-reloads on file changes
#     uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
