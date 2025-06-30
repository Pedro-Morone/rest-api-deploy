import mysql from 'mysql2/promise'

const config = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'moviesdb'
}

const connection = await mysql.createConnection(config)

export class MovieModel {
  static async getAll (param) {
    const allMovies = Object.keys(param).length === 0
    if (allMovies) {
      const [movies] = await connection.query(`
        SELECT 
          BIN_TO_UUID(m.id) AS id,
          m.title,
          m.year,
          m.director,
          m.duration,
          m.poster,
          m.rate, 
          GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
        FROM movies AS m
        JOIN movie_genres AS mg ON m.id = mg.movie_id
        JOIN genres AS g ON mg.genre_id = g.id
        GROUP BY m.id;`)
      return movies
    }

    const { title, director, genre, year } = param
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase()
      const [movies] = await connection.query(`
        SELECT 
          BIN_TO_UUID(m.id) AS id,
          m.title,
          m.year,
          m.director,
          m.duration,
          m.poster,
          m.rate,
          GROUP_CONCAT(g2.name ORDER BY g2.name SEPARATOR ', ') AS genres
        FROM movies m
        JOIN movie_genres AS mg_filter ON m.id = mg_filter.movie_id
        JOIN genres AS g_filter ON mg_filter.genre_id = g_filter.id
        JOIN movie_genres AS mg ON m.id = mg.movie_id
        JOIN genres AS g2 ON mg.genre_id = g2.id
        WHERE LOWER(g_filter.name) = ?
        GROUP BY m.id;`, [lowerCaseGenre])
      return movies
    }

    if (year) {
      const [movies] = await connection.query(`
        SELECT 
          BIN_TO_UUID(m.id) AS id,
          m.title,
          m.year,
          m.director,
          m.duration,
          m.poster,
          m.rate, 
          GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
        FROM movies AS m
        JOIN movie_genres AS mg ON m.id = mg.movie_id
        JOIN genres AS g ON mg.genre_id = g.id
        WHERE m.year = ?
        GROUP BY m.id;`, [year])
      return movies
    }

    if (title) {
      const [movies] = await connection.query(`
        SELECT 
          BIN_TO_UUID(m.id) AS id,
          m.title,
          m.year,
          m.director,
          m.duration,
          m.poster,
          m.rate, 
          GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
        FROM movies AS m
        JOIN movie_genres AS mg ON m.id = mg.movie_id
        JOIN genres AS g ON mg.genre_id = g.id
        WHERE LOWER(m.title) = ?
        GROUP BY m.id;`, [title.toLowerCase()])
      return movies
    }

    if (director) {
      const [movies] = await connection.query(`
        SELECT 
          BIN_TO_UUID(m.id) AS id,
          m.title,
          m.year,
          m.director,
          m.duration,
          m.poster,
          m.rate, 
          GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
        FROM movies AS m
        JOIN movie_genres AS mg ON m.id = mg.movie_id
        JOIN genres AS g ON mg.genre_id = g.id
        WHERE LOWER(m.director) = ?
        GROUP BY m.id;`, [director.toLowerCase()])
      return movies
    }
    return []
  }

  static async getById (id) {
    const [movies] = await connection.query(`
      SELECT 
        BIN_TO_UUID(m.id) AS id,
        m.title,
        m.year,
        m.director,
        m.duration,
        m.poster,
        m.rate, 
        GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
      FROM movies AS m
      JOIN movie_genres AS mg ON m.id = mg.movie_id
      JOIN genres AS g ON mg.genre_id = g.id
      WHERE BIN_TO_UUID(m.id) = ?
      GROUP BY m.id;`, [id])
    return movies.length > 0 ? movies[0] : null
  }

  static async create (data) {
    const [existingMovie] = await connection.query(`
      SELECT * FROM movies WHERE LOWER(title) = ?;`, [data.data.title.toLowerCase()])

    if (existingMovie[0].length >= 0) {
      async function createMovie (movieData) {
        await connection.query(`
          INSERT INTO movies (id, title, year, director, duration, poster, rate) VALUES
            (UUID_TO_BIN(UUID()), ?, ?, ?, ?, ?, ?);`, [movieData.title, movieData.year, movieData.director, movieData.duration, movieData.poster, movieData.rate])
      }
      async function insertMovieGenres (movieData) {
        for (let i = 0; i < movieData.genre.length; i++) {
          await connection.query(`
            INSERT INTO movie_genres (movie_id, genre_id) VALUES
            ((SELECT id FROM movies WHERE title = ?),
            (SELECT id FROM genres WHERE name = ?));`, [movieData.title, movieData.genre[i]])
        }
      }
      await createMovie(data.data)
      await insertMovieGenres(data.data)
      const [movie] = await connection.query(`
        SELECT
          BIN_TO_UUID(m.id) AS id,
          m.title,
          m.year,
          m.director,
          m.duration,
          m.poster,
          m.rate,
          GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
        FROM movies AS m
        JOIN movie_genres AS mg ON m.id = mg.movie_id
        JOIN genres AS g ON mg.genre_id = g.id
        WHERE LOWER(m.title) = ?
        GROUP BY m.id;`, [data.data.title])
      return movie
    }
    return { error: 'Movie already exists' }
  }

  static async update (data) {
    const movieID = data.id
    const allowedFields = ['title', 'year', 'director', 'duration', 'poster', 'rate']
    const updates = []
    const values = []

    for (const field of allowedFields) {
      if (data.input[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(data.input[field])
      }
    }

    values.push(movieID)

    const [sql] = await connection.query(`
      UPDATE movies 
      SET ${updates.join(', ')} 
      WHERE id = UUID_TO_BIN(?)
      ;`, values)
    if (sql.affectedRows === 0) return false
    return true
  }

  static async delete (id) {
    const [result] = await connection.query(`
      DELETE FROM movies WHERE id = UUID_TO_BIN(?);`, [id])
    if (result.affectedRows === 0) return false
    return true
  }
}
