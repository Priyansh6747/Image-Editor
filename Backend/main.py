from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routes.HandleText import TextRouter
from Routes.HandleImage import ImageRouter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(TextRouter, prefix="/text")
app.include_router(ImageRouter, prefix="/image")


@app.head("/")
async def monitor():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Hello World"}
