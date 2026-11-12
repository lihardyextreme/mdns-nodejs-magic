class Answer {

  constructor() {
    this.name = undefined
  }

  init(name, type, _class, ttl) {
    this.name = name
    this.type = type
    this._class = _class
    this.ttl = ttl
  }
}

class PTR extends Answer {
  constructor(packet) {
    super()
    this.location = packet.readQString()
  }
}

class SRV extends Answer {
  constructor(packet, rdLength) {
    super()
    if (rdLength > 0) {
      this.priority = packet.readShortAsInt();
      this.weight = packet.readShortAsInt();
      this.port = packet.readShortAsInt();
      this.target = packet.readQString();
    } else {
      this.priority = 0;
      this.weight = 0;
      this.port = 0;
      this.target = "";
    }
  }
}

class TXT extends Answer {
  constructor(packet, rdLength) {
    super(rdLength)
    this.txt = ""
    while (rdLength > 0) {
      let s = packet.readStringLen(rdLength)
      this.txt += s
      rdLength -= s.length + 1;
    }
  }
}

class A extends Answer {

  constructor(packet) {
    super()
    let addr = packet.readStringLen(4);
    this.address = `${addr.readUInt8(0)}.${addr.readUInt8(1)}.${addr.readUInt8(2)}.${addr.readUInt8(3)}`
  }

}

class AAAA extends Answer {

  constructor(packet, rdLength) {
    super()
    let s = packet.readStringLen(rdLength)
    this.address = this.asIPv6string(s);
  }

  asIPv6string(buffer) {
    function* hexFormatValues(buffer) {
    for (let x of buffer) {
      const hex = x.toString(16)
      yield hex.padStart(2, '0')
    }
    }
    let ipv6 = ""
    for (let hex of hexFormatValues(buffer)) {
      if(ipv6.length>0) ipv6+=':'
      ipv6+=hex
    }
    return ipv6
  }
}

module.exports = {
  A, AAAA, PTR, SRV, TXT
}
