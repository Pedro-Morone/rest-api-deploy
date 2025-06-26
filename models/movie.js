import { readJSON } from '../utils.js'
import { randomUUID } from 'node:crypto'

const movies = readJSON('./movies.json')

export class MovieModel {
  static async getAll (param) {
    if (Object.keys(param).length === 0) {
      return movies
    }
    const { title, director, genre, year } = param
    if (genre) {
      return movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    }

    if (year) {
      return movies.filter(movie => movie.year === parseInt(year))
    }

    if (title) {
      const decodedTitle = decodeURIComponent(title)
      return movies.filter(movie => movie.title.toLowerCase() === decodedTitle.toLowerCase())
    }

    if (director) {
      const decodedDirector = decodeURIComponent(director)
      return movies.filter(movie => movie.director.toLowerCase() === decodedDirector.toLowerCase())
    }
    return 0
  }

  static async getById (id) {
    return movies.find(movie => movie.id === id)
  }

  static async create (movie) {
    const newMovie = {
      id: randomUUID(),
      ...movie.data
    }
    movies.push(newMovie)
    return newMovie
  }

  static async delete ({ id }) {
    const movieIndex = movies.findIndex(movie => movie.id === id)
    if (movieIndex === -1) return false

    movies.splice(movieIndex, 1)
    return true
  }

  static async update ({ id, input }) {
    const movieIndex = movies.findIndex(movie => movie.id === id)
    if (movieIndex === -1) return false

    const updatedMovie = {
      ...movies[movieIndex],
      ...input.data
    }
    movies[movieIndex] = updatedMovie
    return updatedMovie
  }
}
