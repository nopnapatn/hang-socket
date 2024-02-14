const socket = require("socket.io-client")("http://localhost:3000")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

socket.on("message", (data) => {
  console.log(data)
})

socket.on("status", ({ code, phrase, message }) => {
  console.log(`Server response: ${code} ${phrase} - ${message}`)
  if (code === 800 && phrase === "OK hang!" && message.includes("won")) {
    rl.close()
    socket.disconnect()
  }
})

rl.on("line", (input) => {
  socket.emit("guess", input)
})

rl.on("close", () => {
  console.log("Goodbye!")
  socket.disconnect()
})
