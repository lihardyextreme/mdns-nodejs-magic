# mdns-nodejs-magic

A lightweight Node.js library for discovering services over multicast DNS (mDNS), designed for local network service discovery.

This package listens for mDNS traffic, tracks service records, and surfaces discovered services through a simple callback-based API.

## Features

- mDNS service discovery over UDP multicast
- Service lookup by type, such as `_amzn-wplay._tcp.local`
- Callback-based service discovery
- Basic DNS packet parsing for common record types
- Simple API for local network service browsing

## Installation

Directly from github:

```bash
npm install lihardyextreme/mdns-nodejs-magic
```

## Quick Start

```js
const Client = require('mdns-nodejs-magic');

const client = new Client();

client.init('_amzn-wplay._tcp.local', (hostname, ip, port) => {
  console.log('Found service:', { hostname, ip, port });
}, (packet) => {
  console.log('Packet received:', packet.isResponse);
});
```

## API

### `new Client()`

Creates a new mDNS client instance.

### `client.init(serviceName, onService, onPacket)`

Starts listening for mDNS responses and begins discovery for the specified service.

Parameters:

- `serviceName`: the advertised service name to track, such as `'_amzn-wplay._tcp.local'`
- `onService`: invoked when a matching service is discovered
  - callback signature: `(hostname, ip, port) => {}`
- `onPacket`: optional callback invoked with every parsed packet
  - callback signature: `(packet) => {}`

## How It Works

The library:

1. Creates a UDP socket on the local machine.
2. Binds to the mDNS multicast port (`5353`).
3. Joins the mDNS multicast group (`224.0.0.251` on IPv4).
4. Sends service discovery queries for common DNS-SD names.
5. Parses incoming answers and resolves service metadata like:
   - PTR records
   - SRV records
   - A records
   - TXT records
6. Calls the user-provided callback when a relevant service is found.

## Example: Discovering a Service

```js
const Client = require('./Client');

const client = new Client();

client.init('_services._dns-sd._udp.local', (hostname, ip, port) => {
  console.log('Discovered service:');
  console.log({ hostname, ip, port });
}, (packet) => {
  console.log('Received packet:', packet.isResponse ? 'response' : 'query');
});
```

## Important Notes

- This library is intended for local-network service discovery.
- It uses UDP multicast and requires appropriate multicast permissions on the host OS.
- On systems with multiple network interfaces, ensure the socket is bound to the appropriate interface and multicast group.
- For full compatibility with some environments, the socket may need explicit interface configuration.

## Troubleshooting

### No services found

- Make sure the service is actually advertised on the same local network.
- Verify the service name is correct.
- Ensure the socket is bound and joined to the multicast group.
- Check firewall and OS networking rules for multicast traffic.

### Socket errors

- Confirm you are binding to a valid local address and port.
- Check whether the port is already in use.
- Review OS-level multicast support and routing.

### Packet parsing issues

- Ensure the incoming packets are valid mDNS packets.
- Confirm your service names match the expected format.
- If using multiple interfaces, verify the selected outbound interface is correct.

## Project Structure

```text
.
├── Client.js
├── LICENSE
├── package.json
├── lib/
│   ├── Answers.js
│   ├── Question.js
│   ├── const.js
│   ├── mdns.js
│   └── packet.js
├── test/
│   └── demo.js
└── README.md
```

## License

This project is licensed under the GNU Lesser General Public License v3.0.

See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request with clear testing steps and examples.

## Notes

This package is intended as a simple mDNS discovery helper for Node.js. It is best suited for local network experimentation, service discovery, and integration into home automation or embedded systems.