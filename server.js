const express = require("express")
const http = require("http")
const socketIO = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

let wordToGuess = ""
let hiddenWord = []
let attempts = 6
let guessedLetters = []
let players = []

const statusCodeOK = 800
const statusCodeBad = 900

const statusPhaseOK = "OK hang!"
const statusPhaseBad = "Bad hang!"

function initializeGame() {
  wordToGuess = generateRandomWord()
  hiddenWord = Array(wordToGuess.length).fill("_")
  attempts = 6
  guessedLetters = []
}

function generateRandomWord() {
  const words = [
    "javascript",
    "typescript",
    "mongodb",
    "express",
    "react",
    "nodejs",
  ]
  return words[Math.floor(Math.random() * words.length)]
}

function broadcast(message) {
  io.emit("message", message)
}

function sendStatus(socket, code, phrase, message) {
  socket.emit("status", { code, phrase, message })
}

io.on("connection", (socket) => {
  console.log("🚀 ~ io.on ~ socket: new client connected")

  players.push(socket)

  if (players.length <= 2) {
    initializeGame()
    broadcast(
      `Hang started! Word: ${hiddenWord.join(
        " ",
      )}, Attempts left: ${attempts}\n`,
    )

    socket.on("guess", (guess) => {
      if (!guessedLetters.includes(guess)) {
        guessedLetters.push(guess)

        if (wordToGuess.includes(guess)) {
          for (let i = 0; i < wordToGuess.length; i++) {
            if (wordToGuess[i] === guess) {
              hiddenWord[i] = guess
            }
          }

          if (!hiddenWord.includes("_")) {
            broadcast(
              `Congratulations! Player guessed the word: ${wordToGuess}\n`,
            )
            initializeGame()
            broadcast(
              `Hang started! Word: ${hiddenWord.join(
                " ",
              )}, Attempts left: ${attempts}\n`,
            )
          } else {
            broadcast(
              `Correct guess! Word: ${hiddenWord.join(
                " ",
              )}, Attempts left: ${attempts}\n`,
            )
          }
        } else {
          attempts--
          broadcast(
            `Incorrect guess! Word: ${hiddenWord.join(
              " ",
            )}, Attempts left: ${attempts}\n`,
          )

          if (attempts === 0) {
            broadcast(`Hang over! The word was: ${wordToGuess}\n`)
            initializeGame()
            broadcast(
              `Hang started! Word: ${hiddenWord.join(
                " ",
              )}, Attempts left: ${attempts}\n`,
            )
          }
        }
      } else {
        sendStatus(
          socket,
          statusCodeBad,
          statusPhaseBad,
          `You already guessed "${guess}". Try again.`,
        )
        console.log(
          `🚀 ~ socket.on ~ status: ${statusCodeBad} ${statusPhaseBad}`,
        )
      }
    })

    socket.on("disconnect", () => {
      console.log("🚀 ~ socket.on ~ socket: client disconnected")
      players.splice(players.indexOf(socket), 1)
      if (players.length === 1) {
        sendStatus(
          players[0],
          statusCodeOK,
          statusPhaseOK,
          "Waiting for another player to join...",
        )
        console.log(`🚀 ~ socket.on ~ status: ${statusCodeOK} ${statusPhaseOK}`)
      }
    })
  } else {
    sendStatus(
      socket,
      statusCodeOK,
      statusPhaseOK,
      "Maximum players reached. Please wait for the next round.",
    )
    console.log(`🚀 ~ socket.on ~ status: ${statusCodeOK} ${statusPhaseOK}`)
  }
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`🚀 ~ server ~ listening on port: ${PORT}`)
})
