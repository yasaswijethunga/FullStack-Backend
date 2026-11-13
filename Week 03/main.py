from typing import Optional

from fastapi import FastAPI, HTTPException, Response, status
from pydantic import BaseModel

app = FastAPI(title="Movie API")


class MovieCreate(BaseModel):
    title: str
    year: int
    genre: str


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None


class Movie(MovieCreate):
    id: int


movies = [
    {"id": 1, "title": "Inception", "year": 2010, "genre": "Sci-Fi"},
    {"id": 2, "title": "The Matrix", "year": 1999, "genre": "Sci-Fi"},
    {"id": 3, "title": "Parasite", "year": 2019, "genre": "Thriller"},
]


def find_movie(movie_id: int):
    for movie in movies:
        if movie["id"] == movie_id:
            return movie
    raise HTTPException(status_code=404, detail="Movie not found")


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}


@app.get("/movies", response_model=list[Movie])
def get_movies(min_year: Optional[int] = None, genre: Optional[str] = None):
    result = movies
    if min_year is not None:
        result = [m for m in result if m["year"] >= min_year]
    if genre is not None:
        result = [m for m in result if m["genre"].lower() == genre.lower()]
    return result


@app.get("/movies/{movie_id}", response_model=Movie)
def get_movie(movie_id: int):
    return find_movie(movie_id)


@app.post("/movies", response_model=Movie, status_code=status.HTTP_201_CREATED)
def create_movie(movie: MovieCreate):
    new_id = max((m["id"] for m in movies), default=0) + 1
    new_movie = {"id": new_id, **movie.model_dump()}
    movies.append(new_movie)
    return new_movie


@app.put("/movies/{movie_id}", response_model=Movie)
def replace_movie(movie_id: int, movie: MovieCreate):
    existing = find_movie(movie_id)
    existing.update(movie.model_dump())
    return existing


@app.patch("/movies/{movie_id}", response_model=Movie)
def update_movie(movie_id: int, changes: MovieUpdate):
    existing = find_movie(movie_id)
    existing.update(changes.model_dump(exclude_unset=True))
    return existing


@app.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: int):
    existing = find_movie(movie_id)
    movies.remove(existing)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
