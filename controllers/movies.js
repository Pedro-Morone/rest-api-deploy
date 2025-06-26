import { MovieModel } from '../models/movie.js'
import { validateMovie, validatePartialMovie } from '../schemas/movies.js'

export class MovieController {
  static async getAll (req, res) {
    const movies = await MovieModel.getAll(req.query)
    if (movies === 0) {
      return res.status(404).json({ error: 'No movies found' })
    }

    res.json(movies)
  }

  static async getById (req, res) {
    const { id } = req.params
    const movie = await MovieModel.getById(id)
    if (movie) {
      return res.json(movie)
    }
    res.status(404).json({ error: 'Movie not found' })
  }

  static async create (req, res) {
    const input = validateMovie(req.body)

    if (input.error) {
      return res.status(422).json({ error: JSON.parse(input.error.message) }
      )
    }

    const newMovie = await MovieModel.create(input)
    res.status(201).json(newMovie)
  }

  static async delete (req, res) {
    const { id } = req.params

    const deletedMovie = MovieModel.delete(id)
    if (!deletedMovie) {
      return res.status(404).json({ error: 'Movie not found' })
    }
    return res.json({ message: 'Movie deleted' })
  }

  static async update (req, res) {
    const result = validatePartialMovie(req.body)
    if (result.error) {
      return res.status(422).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const updatedMovie = await MovieModel.update({ id, input: result.data })
    if (!updatedMovie) {
      return res.status(404).json({ error: 'Movie not found' })
    }
    res.json(updatedMovie)
  }
}
