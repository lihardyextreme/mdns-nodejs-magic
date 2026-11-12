class Question {

  constructor(name,type,_class=1) {
    this.name = name
    this.type = type
    this._class = _class
  }

  deserialize(packet) {
    this.name = packet.readQString();
    this.type = packet.readUInt16();
    this._class = packet.readUInt16();
  }

  serialize(packet) {
    packet.writeQString(this.name);
    packet.writeUInt16(this.type);
    packet.writeUInt16(this._class);
  }
}

module.exports = Question
