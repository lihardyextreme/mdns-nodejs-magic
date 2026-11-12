
const { Buffer } = require('node:buffer')

const Question = require('./Question')
const { A, AAAA, PTR, SRV, TXT } = require('./Answers')

const {
  TYPE_A,
  TYPE_PTR,
  TYPE_TXT,
  TYPE_AAAA,
  TYPE_SRV,
  TYPE_ANY,
} = require('./const')

class Packet {

  constructor(params) {
    this._buffer = params.buffer || Buffer.alloc(64 * 8);
    this._pos = 0

    this.ID = params.ID || 0
    this.FLAGS = params.FLAGS || 0
    this.isResponse = false

    this.questions = []
    this.answers = []
    this.nameservers = []
    this.additionalRecords = []
  }

  writeQString(qs) {
    if (qs.length > 0) {
      let sp = qs.split(".");
      for (let s of sp) {
        let len = s.length & 0xff;
        this._buffer.writeUInt8(len, this._pos);
        this._pos += 1
        this._buffer.write(s, this._pos);
        this._pos += len
      }
    }
    this._buffer.writeUInt8(0, this._pos);
    this._pos += 1
  }

  writeUInt8(v) {
    this._buffer.writeUInt8(v, this._pos);
    this._pos += 1
  }

  readUInt8() {
    let v = this._buffer.readUInt8(this._pos);
    this._pos += 1
    return v
  }

  readShortAsInt() {
    return this.readUInt16() & 0xFFFF;
  }

  writeUInt16(v) {
    this._buffer.writeUInt16BE(v, this._pos);
    this._pos += 2
  }

  readUInt16() {
    let v = this._buffer.readUInt16BE(this._pos);
    this._pos += 2
    return v
  }

  readUInt32() {
    let v = this._buffer.readUInt32BE(this._pos);
    this._pos += 4
    return v
  }

  readStringLen(len) {
    let pos = this.getPosition()
    let end = pos + len
    let s = this._buffer.slice(pos, end)
    this.setPosition(end)
    return s
  }

  writeQuestion(q) {
    this.writeQString(q.name);
    this.writeUInt16(q.type);
    this.writeUInt16(q._class);
  }

  addQuestion(q) {
    this.questions.push(q)
  }

  addAnswer(a) {
    this.answers.push(a)
  }

  serialize() {
    this.writeUInt16(this.ID)
    this.writeUInt16(this.FLAGS)
    this.writeUInt16(this.questions.length)
    this.writeUInt16(this.answers.length)
    this.writeUInt16(this.nameservers.length)
    this.writeUInt16(this.additionalRecords.length)
    for (let o of this.questions)
      o.serialize(this)
    for (let o of this.answers)
      ;//w.write???(o)
    for (let o of this.nameservers)
      ;//w.write???(o)
    for (let o of this.additionalRecords)
      ;//w.write???(o)
  }

  deserialize() {
    this.ID = this.readUInt16()
    let FLAGS = this.readUInt16()
    this.FLAGS = FLAGS
    this.isResponse = !!(0x8000 & FLAGS)
    this.opCode = ((FLAGS & 0x7800) >> 12)
    this.AA = !!(FLAGS & 0x0400)
    this.TC = !!(FLAGS & 0x0200)
    this.RD = !!(FLAGS & 0x0100)
    this.RA = !!(FLAGS & 0x0080)

    this.Z = !!(FLAGS & 0x0040)
    this.AD = !!(FLAGS & 0x0020)
    this.CD = !!(FLAGS & 0x0010)
    this.RCODE = FLAGS & 0x000F

    const questionsCount = this.readUInt16()
    const answersCount = this.readUInt16()
    const nameserversCount = this.readUInt16()
    const additionalRecordsCount = this.readUInt16()
    let i
    for (i = 0; i < questionsCount; i++) {
      this.readQuestion()
    }
    for (i = 0; i < answersCount; i++) {
      this.readAnswer()
    }
    for (i = 0; i < nameserversCount; i++) {
      this.readAnswer()
    }
    for (i = 0; i < additionalRecordsCount; i++) {
      this.readAnswer()
    }
  }

  readQuestion() {
    let q = new Question()
    q.deserialize(this)
    this.addQuestion(q)
  }

  readAnswer() {
    let name = this.readQString()
    let type = this.readUInt16()
    let class_ = this.readUInt16()
    let ttl = this.readUInt32()
    let rdLength = this.readUInt16()

    let answer;
    switch (type) {
      case TYPE_A:
        answer = new A(this);
        break;
      case TYPE_PTR:
        answer = new PTR(this);
        break;
      case TYPE_TXT:
        answer = new TXT(this, rdLength);
        break;
      case TYPE_AAAA:
        answer = new AAAA(this, rdLength);
        break;
      case TYPE_SRV:
        answer = new SRV(this, rdLength);
        break;
      default:
        this.readStringLen(rdLength) // consume RDATA
        console.log(">>>>>> Answer - read unknown type ", type, name);
        return
    }
    answer.init(name, type, class_, ttl);
    this.addAnswer(answer)
  }

  readQString() {
    let name = ""
    let len = 0
    let nextPosition = 0
    while (true) {
      len = this.readUInt8()
      if ((len & 0xc0) != 0) { // 0xc0
        let offset = this.readUInt8() & 0xff
        offset |= (len & 0x3f) << 8
        if (nextPosition == 0)
          nextPosition = this.getPosition()
        this.setPosition(offset)
        continue
      }
      if (len == 0) break;
      let str = this.readStringLen(len);
      if (name.length > 0)
        name += ".";
      name += str;
    }
    if (nextPosition > 0) {
      this.setPosition(nextPosition)
    }
    return name
  }

  getPosition() {
    return this._pos
  }

  setPosition(position) {
    this._pos = position
  }

  buffer() {
    return this._buffer
  }

  size() {
    return this._pos
  }

  toString() {
    return {
      response: this.isResponse,
      ID: this.ID,
      FLAGS: this.FLAGS,
      xFLAGS: this.FLAGS.toString(16),
      questions: this.questions,
      answers: this.answers
    }
  }
}

module.exports = Packet
