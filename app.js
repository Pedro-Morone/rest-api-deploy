const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')

const validateMovie = require('./schemas/movies').validateMovie
const validatePartialMovie = require('./schemas/movies').validatePartialMovie
const movies = require('./movies.json')
const PORT = process.env.PORT ?? 1234

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:63725',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))

app.get('/movies', (req, res) => {
  // Podrias poner * para permitir cualquier origen, pero es mejor especificar el origen, para iniciar la web con npm use "npx servor ./web" supongo que tambien funcionaria con xamp
  res.header('Access-Control-Allow-Origin', 'http://localhost:63725')

  const { title, director, genre, year } = req.query

  if (Object.keys(req.query).length === 0) {
    return res.json(movies)
  }

  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filteredMovies)
  }

  if (year) {
    const filteredMovies = movies.filter(movie => movie.year === parseInt(year))
    return res.json(filteredMovies)
  }
  if (title) {
    const decodedTitle = decodeURIComponent(title)
    const filteredMovies = movies.filter(movie => movie.title.toLowerCase() === decodedTitle.toLowerCase())
    return res.json(filteredMovies)
  }
  if (director) {
    const decodedDirector = decodeURIComponent(director)
    const filteredMovies = movies.filter(movie => movie.director.toLowerCase() === decodedDirector.toLowerCase())
    return res.json(filteredMovies)
  }
  res.status(400).json({ error: 'Movie not found' })
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(m => m.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ error: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(422).json({ error: JSON.parse(result.error.message) }
    )
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (result.error) {
    return res.status(422).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ error: 'Movie not found' })
  }

  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updatedMovie
  res.json(updatedMovie)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
