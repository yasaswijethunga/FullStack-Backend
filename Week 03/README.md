# Week 3 - Movie API with Python FastAPI

The Express movie REST API from Weeks 1-2 ported to FastAPI.

## Run

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Open http://127.0.0.1:8000/docs for Swagger UI.

## Endpoints

- GET /movies (optional query parameters: min_year, genre)
- GET /movies/{id}
- POST /movies
- PUT /movies/{id}
- PATCH /movies/{id}
- DELETE /movies/{id}
