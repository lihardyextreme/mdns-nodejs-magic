const Packet = require('./packet')
const Const = require('./const')
const Question = require('./Question')

const ANY_IP = '0.0.0.0'
const MDNS_PORT = 5353
const MDNS_IP4 = '224.0.0.251'
const MDNS_IP6 = 'FF02::FB'

function sendQueryAll(socket) {
  sendPacketQuestion(socket, "_services._dns-sd._udp.local")
  sendPacketQuestion(socket, "_services._dns-sd._udp")
  sendPacketQuestion(socket, "b._dns-sd._udp.local")
}

function sendPacketQuestion(socket, packet) {
  if (!packet) return
  const ID = 0
  const FLAGS = 0
  const w = new Packet({ ID, FLAGS })
  if((typeof packet) === "string") {
    let name = packet
    w.addQuestion(new Question(name, Const.TYPE_PTR))
  } else if(packet.type==Const.TYPE_PTR) {
    w.addQuestion(new Question(packet.location, Const.TYPE_PTR))
  } else if(packet.type==Const.TYPE_SRV) {
    w.addQuestion(new Question(packet.target, Const.TYPE_A))
    w.addQuestion(new Question(packet.target, Const.TYPE_AAAA))
  } else {
  }
  w.serialize()
  socket.send(w.buffer(), 0, w.size(), MDNS_PORT, MDNS_IP4, function (error) {
    if (error) {
      console.log('<- error: ', error);
    }
  })

}

module.exports = {
  sendQueryAll, sendPacketQuestion,
  MDNS_PORT, MDNS_IP4, MDNS_IP6, ANY_IP
}