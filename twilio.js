const WebSocket = require("ws");
const base64 = require("base-64");
const express = require("express");
const http = require("http");
const fs = require("fs");
const wavefile = require("wavefile");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const HTTP_SERVER_PORT = 5000;

wss.on("connection", function connection(ws) {
  console.log("Connection accepted");
  // const streamSid = start.streamSid;
  // console.log(streamSid)
  // readStream = fs.createReadStream(
  //   "mixkit-beach-waves-with-children-ambience-1193.wav"
  // );

  // const chunks = [];

  // readStream.on("data", function (data) {
  //   chunks.push(data);
  // });

  // readStream.on("end", function () {
  //   const buffer = Buffer.concat(chunks);
  //   const wav = new wavefile.WaveFile(buffer);
  //   wav.toBitDepth("8");
  //   wav.toSampleRate(8000);
  //   wav.toMuLaw();

  //   const payload = Buffer.from(wav.data.samples).toString("base64");
  //   console.log(payload);

  // const uint8Array = new Uint8Array(buffer);
  // console.log(uint8Array);

  // const mulaw = short2ulaw(buffer);
  // console.log(mulaw);

  // ws.send(
  //   JSON.stringify({
  //     event: "media",
  //     media: {
  //       payload: uint8Array.buffer,
  //     },
  //   }),
  //   { binary: true }
  // );
  // });

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
        readStream = fs.createReadStream(
          "mixkit-beach-waves-with-children-ambience-1193.wav"
        );
        const chunks = [];

        readStream.on("data", function (data) {
          chunks.push(data);
        });

        readStream.on("end", function () {
          const buffer = Buffer.concat(chunks);
          const wav = new wavefile.WaveFile(buffer);
          wav.toBitDepth("8");
          wav.toSampleRate(8000);
          wav.toMuLaw();

          const payload = Buffer.from(wav.data.samples).toString("base64");
          console.log(payload);

          ws.send(
            JSON.stringify({
              event: "media",
              media: {
                payload: payload,
              },
              streamSid: data.start.streamSid,
            })
            // { binary: true }
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
function pcmToMuLaw(pcmData) {
  const muLawData = new Uint8Array(pcmData.length / 2);

  for (let i = 0, j = 0; i < pcmData.length; i += 2, j++) {
    const pcmSample = (pcmData[i + 1] << 8) | pcmData[i]; // Combine two 8-bit PCM samples into a 16-bit sample
    const muLawSample = encodeMuLaw(pcmSample); // Convert PCM sample to mu-law
    muLawData[j] = muLawSample;
  }

  return muLawData;
}

function encodeMuLaw(sample) {
  const sign = sample & 0x8000; // Extract sign bit
  let exponent = 7;
  let mantissa;

  if (!sign) {
    sample = -sample; // If positive, make negative for easier calculation
  }

  sample = sample + 132; // Bias the sample

  if (sample > 32635) {
    // Clip sample if out of range
    sample = 32635;
  }

  exponent = Math.floor(Math.log2(sample)); // Calculate exponent

  mantissa = (sample >> (exponent - 7)) & 0x0f; // Calculate mantissa

  return ~(sign | (exponent << 4) | mantissa); // Combine sign, exponent, and mantissa
}

// function short2ulaw(b) {
//   // Linear16 to linear8 -> buffer is half the size
//   // As of LINEAR16 nature, the length should ALWAYS be even
//   const returnbuffer = Buffer.alloc(b.length / 2);

//   for (let i = 0; i < b.length / 2; i++) {
//     // The nature of javascript forbids us to use 16-bit types. Every number is
//     // A double precision 64 Bit number.
//     let short = b.readInt16LE(i * 2);

//     let sign = 0;

//     // Determine the sign of the 16-Bit byte
//     if (short < 0) {
//       sign = 0x80;
//       short = short & 0xef;
//     }

//     short = short > 32635 ? 32635 : short;

//     const sample = short + 0x84;
//     const exponent = exp_lut[sample >> 8] & 0x7f;
//     const mantissa = (sample >> (exponent + 3)) & 0x0f;
//     let ulawbyte = ~(sign | (exponent << 4) | mantissa) & 0x7f;

//     ulawbyte = ulawbyte == 0 ? 0x02 : ulawbyte;

//     returnbuffer.writeUInt8(ulawbyte, i);
//   }

//   return returnbuffer;
// }
