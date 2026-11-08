const express = require("express");
const morgan = require("morgan");

const app = express();

app.use(express.json());

function simpleLogger(req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
}

// app.use(simpleLogger);
app.use(morgan("dev"));

let movies = [
  { id: 1, title: "Inception", year: 2010, genre: "Sci-Fi" },
  { id: 2, title: "The Matrix", year: 1999, genre: "Sci-Fi" },
  { id: 3, title: "Parasite", year: 2019, genre: "Thriller" },
];

function validateMovie(body, partial = false) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  if (!partial && body.title === undefined) {
    errors.push("title is required");
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    errors.push("title must be a non-empty string");
  }

  if (!partial && body.year === undefined) {
    errors.push("year is required");
  }

  if (
    body.year !== undefined &&
    (!Number.isInteger(body.year) ||
      body.year < 1888 ||
      body.year > maximumYear)
  ) {
    errors.push("year must be a valid integer");
  }

  if (!partial && body.genre === undefined) {
    errors.push("genre is required");
  }

  if (
    body.genre !== undefined &&
    (typeof body.genre !== "string" || body.genre.trim().length === 0)
  ) {
    errors.push("genre must be a non-empty string");
  }

  return errors;
}

function sendValidationError(res, errors) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Movie data is invalid",
      details: errors,
    },
  });
}

function sendMovieNotFound(res) {
  return res.status(404).json({
    error: {
      code: "MOVIE_NOT_FOUND",
      message: "Movie not found",
    },
  });
}

function sendInvalidQuery(res, message) {
  return res.status(400).json({
    error: {
      code: "INVALID_QUERY_PARAMETER",
      message,
    },
  });
}

app.get("/movies", (req, res) => {
  const { genre, minYear, sort } = req.query;

  let result = [...movies];

  if (genre !== undefined) {
    if (typeof genre !== "string") {
      return sendInvalidQuery(res, "genre must be a single text value");
    }

    result = result.filter(
      (m) => m.genre.toLowerCase() === genre.trim().toLowerCase(),
    );
  }

  if (minYear !== undefined) {
    const minimumYear = Number(minYear);

    if (typeof minYear !== "string" || !Number.isInteger(minimumYear)) {
      return sendInvalidQuery(res, "minYear must be a valid integer");
    }

    result = result.filter((m) => m.year >= minimumYear);
  }

  if (sort !== undefined) {
    if (sort === "year") {
      result.sort((a, b) => a.year - b.year);
    } else if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      return sendInvalidQuery(res, "sort must be either year or title");
    }
  }

  res.status(200).json(result);
});

app.get("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find((m) => m.id === id);

  if (!movie) {
    return sendMovieNotFound(res);
  }

  res.status(200).json(movie);
});

app.post("/movies", (req, res) => {
  const body = req.body || {};
  const errors = validateMovie(body, false);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const newId =
    movies.length > 0 ? Math.max(...movies.map((m) => m.id)) + 1 : 1;
  const newMovie = {
    id: newId,
    title: body.title,
    year: body.year,
    genre: body.genre,
  };

  movies.push(newMovie);
  res.status(201).json(newMovie);
});

app.put("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find((m) => m.id === id);

  if (!movie) {
    return sendMovieNotFound(res);
  }

  const body = req.body || {};
  const errors = validateMovie(body, false);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  movie.title = body.title;
  movie.year = body.year;
  movie.genre = body.genre;

  res.status(200).json(movie);
});

app.patch("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find((m) => m.id === id);

  if (!movie) {
    return sendMovieNotFound(res);
  }

  const body = req.body || {};
  const errors = validateMovie(body, true);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  if (body.title !== undefined) movie.title = body.title;
  if (body.year !== undefined) movie.year = body.year;
  if (body.genre !== undefined) movie.genre = body.genre;

  res.status(200).json(movie);
});

app.delete("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = movies.findIndex((m) => m.id === id);

  if (index === -1) {
    return sendMovieNotFound(res);
  }

  movies.splice(index, 1);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route does not exist",
    },
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred",
    },
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Movie API listening on http://localhost:${PORT}`);
});
