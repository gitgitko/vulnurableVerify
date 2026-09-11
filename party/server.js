export default class Server {
  constructor(room) {
    this.room = room;
    this.clients = new Map();
    this.history = [];
  }

  onConnect(conn) {
    this.clients.set(conn.id, { name: "Guest", color: 200 });

    conn.send(JSON.stringify({
      type: "history",
      messages: this.history
    }));
  }

  onMessage(raw, sender) {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === "setName") {
      const name = String(data.name ?? "Guest").slice(0, 48);
      this.clients.get(sender.id).name = name;
      this.room.broadcast(JSON.stringify({
        type: "chat",
        message: { kind: "system", text: `${name} joined`, timestamp: Date.now() }
      }));
      return;
    }

    if (data.type === "chat") {
      const client = this.clients.get(sender.id);
      const msg = {
        kind: "user",
        username: client.name,
        color: client.color,
        text: String(data.text ?? "").slice(0, 4000),
        timestamp: Date.now()
      };
      this.history.push(msg);
      if (this.history.length > 200) this.history.shift();
      this.room.broadcast(JSON.stringify({ type: "chat", message: msg }));
    }
  }

  onClose(conn) {
    const client = this.clients.get(conn.id);
    this.clients.delete(conn.id);
    if (client) {
      this.room.broadcast(JSON.stringify({
        type: "chat",
        message: { kind: "system", text: `${client.name} left`, timestamp: Date.now() }
      }));
    }
  }
}
