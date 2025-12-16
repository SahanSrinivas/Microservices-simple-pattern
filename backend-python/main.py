from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# IMPORTANT: root_path tells FastAPI it is sitting behind a proxy at this URL
app = FastAPI(root_path="/api/python")

# Allow CORS (Good practice, though Ingress mitigates this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/hello")
def say_hello():
    return {"message": "Hello from FastAPI!, this is simple code for testing"}

@app.get("/health")
def health_check():
    return {"status": "ok"}