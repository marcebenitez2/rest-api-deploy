const express = require("express");
const movies = require("./movies.json");
const crypto = require("node:crypto");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
app.use(express.json()); // Para que express entienda el body de las peticiones POST
app.disable("x-powered-by"); // Para que no se vea que estamos usando express, MAS SEGURIDAD

const ACCEPTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://my-app.com",
];

// Para obtrener todas las peliculas o las peliculas de un genero
app.get("/movies", (req, res) => {
  const origin = req.header("origin");

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  const { genre } = req.query;
  if (genre) {
    const moviesByGenre = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(moviesByGenre);
  }
  res.json(movies);
});

// Para obtener una pelicula por id
app.get("/movies/:id", (req, res) => {
  const { id } = req.params;

  const movie = movies.find((movie) => movie.id === id);

  if (movie) return res.json(movie);

  res.status(404).json({ error: "Movie not found" });
});

// Para crear una pelicula
app.post("/movies", (req, res) => {
  const resultado = validateMovie(req.body);

  if (resultado.error) {
    return res.status(400).json({ error: JSON.parse(resultado.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...resultado.data,
  };
  console.log(resultado);
  movies.push(newMovie);

  res.status(201).json(newMovie);
});

// Para actualizar una pelicula
app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;

  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1)
    return res.status(404).json({ error: "Movie not found" });

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

// Para eliminar una pelicula
app.delete("/movies/:id", (req, res) => {
  const origin = req.header("origin");

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  const { id } = req.params;

  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1)
    return res.status(404).json({ error: "Movie not found" });

  movies.splice(movieIndex, 1);

  return res.sendStatus(204);
});

app.options("/movies/:id", (req, res) => {
  const origin = req.header("origin");

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,DELETE,OPTIONS,POST,PATCH,PUT");
  }
  res.send(200);
});

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});


// Hay una libreria para instalar CORS pero habilita a todos los origenes
// npm i cors
// const cors = require("cors");
// app.use(cors()); // Para habilitar a todos los origenes