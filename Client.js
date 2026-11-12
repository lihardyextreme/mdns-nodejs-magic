var udp = require('dgram');
const os = require('os');

const mdns = require('./lib/mdns');
const Packet = require('./lib/packet');
const { A, PTR, SRV, TXT } = require('./lib/Answers')

class Server {
  init(intrestedIn, handleService, handlePaket) {
    let that = this
    this.mcastAddresses = []
    this.refreshInterval = 10000
    this.intrestedIn = intrestedIn
    this.handleService = handleService
    this.handlePaket = handlePaket

    this.sent = {}
    this._ptr = {}
    this._srv = {}
    this._addr = {}
    this.found = {}

    this.socket = udp.createSocket({ type: "udp4", reuseAddr: true });

    this.mcastAddresses = listAllIP4Interfaces(this.socket)

    this.socket.on('error', function (error) {
      console.log('Error: ' + error);
      that.socket.close()
    })


    this.socket.on('message', function (msg, info) {
      let packet = new Packet({ buffer: msg, info })
      try {
        packet.deserialize()
      } catch (e) {
        console.log(e)
        console.log(e.stack)
        var arr = Array.prototype.slice.call(msg, 0)
        console.log(JSON.stringify(arr))
        return
      }
      if(!packet.isResponse) return
      packet.answers.forEach(x => {
        if (x instanceof PTR) {
          if (!Object.keys(that._ptr).includes(x.name))
            that._ptr[x.name] = []
          if (!that._ptr[x.name].includes(x.location)) {
            that._ptr[x.name].push(x.location)
          }
        } else if (x instanceof SRV) {
          that._srv[x.name] = { hostname: x.target, port: x.port }
        } else if (x instanceof A) {
          that._addr[x.name] = x.address
        }
      })
      that.handlePaket && that.handlePaket(packet)
      that.checkForIntrestingServices()
    })

    this.socket.on('listening', function () {
      var address = that.socket.address();
      var port = address.port;
      var family = address.family;
      var ipaddr = address.address;
      console.log('socket is listening at port: ' + port);
      console.log('socket ip:' + ipaddr);
      console.log('socket is IP4/IP6: ' + family);
      that.sendQuery()
    });

    this.socket.on('close', function () {
      console.log('Socket is closed !')
    })

    this.socket.bind(mdns.MDNS_PORT, mdns.ANY_IP, () => {
      this.socket.setMulticastTTL(255)
      joinMdnsOnAllIPv4Interfaces(this.socket,this.mcastAddresses)
      this.refresh(this.socket)
    });
  }

  checkForIntrestingServices() {
    let now = new Date()
    if(!this.intrestedIn) return
    this._ptr[this.intrestedIn]?.forEach(x => {
      let xsrv = this._srv[x]
      if (!xsrv) return
      let { hostname, port } = xsrv
      let ip = this._addr[hostname]
      if (ip) {
        let time = this.found[hostname]?.time || 0
        let diff = now - time
        if (diff>1000) {
          this.found[hostname] = { ip, port, time: new Date() }
          this.handleService && this.handleService(hostname, ip, port)
        }
      }
    })
  }

  sendPacketQuestion(socket, packet) {
    let { name, type } = packet
    let now = new Date()
    let last = this.sent[name]
    if(last) {
      let diff = now - last
      if (diff < 1000) return false
    }
    for (const address of this.mcastAddresses) {
      this.socket.setMulticastInterface(address);
      mdns.sendPacketQuestion(socket, packet)
      this.sent[name] = now
    }

  }

  sendQuery() {
    if(this.intrestedIn)
      this.sendPacketQuestion(this.socket, this.intrestedIn)
    else
      this.sendQueryAll()
  }

  sendQueryAll() {
    for (const address of this.mcastAddresses) {
      this.socket.setMulticastInterface(address);
      mdns.sendQueryAll(this.socket)
    }
  }

  refresh(socket) {
    let that = this
    setTimeout(function () {
      that.sendQuery()
      that.refresh(socket)
    }, this.refreshInterval)
  }

}

function listAllIP4Interfaces(socket) {
  let mcastAddresses = []
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const iface of addresses ?? []) {
      if (
        iface.internal ||
        (iface.family !== 'IPv4' && iface.family !== 4) ||
        mcastAddresses.includes(iface.address)
      ) {
        continue;
      }

      try {
        mcastAddresses.push(iface.address)
      } catch (error) {
        console.warn(`Could not join mDNS on ${iface.address}:`, error.message);
      }
    }
  }

  if (mcastAddresses.length === 0) {
    console.warn('No usable IPv4 interfaces found for mDNS');
  }
  return mcastAddresses
}

function joinMdnsOnAllIPv4Interfaces(socket, mcastAddresses) {
  for (const address of mcastAddresses) {
    try {
      socket.addMembership(mdns.MDNS_IP4, address);
      console.log('Joined mDNS on', address);
    } catch (error) {
      console.warn(`Could not join mDNS on ${address}:`, error.message);
    }
  }
}

module.exports = Server
