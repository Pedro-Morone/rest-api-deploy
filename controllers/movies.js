import { validateMovie, validatePartialMovie } from '../schemas/movies.js'

export class MovieController {
  constructor ({ movieModel }) {
    this.movieModel = movieModel
  }

  getAll = async (req, res) => {
    const movies = await this.movieModel.getAll(req.query)
    if (movies.length === 0) {
      return res.status(404).json({ error: 'No movies found' })
    }

    res.json(movies)
  }

  getById = async (req, res) => {
    const { id } = req.params
    const movie = await this.movieModel.getById(id)
    if (movie) {
      return res.json(movie)
    }
    res.status(404).json({ error: 'Movie not found' })
  }

  create = async (req, res) => {
    const input = validateMovie(req.body)
    if (input.error) {
      return res.status(422).json({ error: JSON.parse(input.error.message) }
      )
    }
    const newMovie = await this.movieModel.create(input)

    res.status(201).json(newMovie)
  }

  delete = async (req, res) => {
    const { id } = req.params

    const deletedMovie = this.movieModel.delete(id)
    if (!deletedMovie) {
      return res.status(404).json({ error: 'Movie not found' })
    }
    return res.json({ message: 'Movie deleted' })
  }

  update = async (req, res) => {
    const result = validatePartialMovie(req.body)
    if (result.error) {
      return res.status(422).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const updatedMovie = await this.movieModel.update({ id, input: result.data })
    if (!updatedMovie) {
      return res.status(404).json({ error: 'Movie not found' })
    }
    res.json(updatedMovie)
  }
}
