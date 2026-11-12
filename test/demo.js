const Client = require('../Client')

let client = new Client()
client.init('_amzn-wplay._tcp.local', (hostname, ip, port) => {
  console.log("found AmazonPlay", hostname, ip, port)
}, (packet) => {
  console.log("packet isResponse",packet.isResponse, packet.questions.length, packet.answers.length)
})
