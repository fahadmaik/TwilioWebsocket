const WebSocket = require("ws");
const base64 = require("base-64");
const express = require("express");
const http = require("http");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const HTTP_SERVER_PORT = 5000;

wss.on("connection", function connection(ws) {
  console.log("Connection accepted");

  let has_seen_media = false;
  let message_count = 0;

  ws.on("message", function incoming(message) {
    if (message === null) {
      console.log("No message received...");
      return;
    }

    const data = JSON.parse(message);

    switch (data.event) {
      case "connected":
        console.log("Connected Message received:", message);
        break;
      case "start":
        readStream = fs.createReadStream("voice.mp3");
        const chunks = [];

        readStream.on("data", function (data) {
          chunks.push(data);
        });

        readStream.on("end", function () {
          const buffer = Buffer.concat(chunks);
          const uint8Array = new Uint8Array(buffer);
          console.log(uint8Array);

          ws.send(
            JSON.stringify({
              event: "media",
              media: {
                payload: uint8Array.buffer,
              },
            }),
            { binary: true }
          );
        });
        console.log("Start Message received:", message);
        console.log(data.start.callSid);
        break;
      case "media":
        if (!has_seen_media) {
          console.log("Media message:", message);
          const payload = data.media.payload;
          console.log("Payload is:", payload);
          const chunk = base64.decode(payload);
          console.log("That's", chunk.length, "bytes");
          console.log(
            "Additional media messages from WebSocket are being suppressed...."
          );
          has_seen_media = true;
        }
        break;
      case "closed":
        console.log("Closed Message received:", message);
        break;
      default:
        break;
    }

    message_count++;
  });

  ws.on("close", function close() {
    console.log(
      "Connection closed. Received a total of",
      message_count,
      "messages"
    );
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(HTTP_SERVER_PORT, () => {
  console.log(`Server listening on: http://localhost:${HTTP_SERVER_PORT}`);
});
