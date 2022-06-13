import express from "express";
import { take } from "rxjs";
import { WebSocketServer } from "ws";

import { createDataSource } from "./data-source.js";

const app = express();
const port = process.env.PORT || 3000;
const source = createDataSource(2000);

/*
 * Approach 1: Polling
 *
 * Serve the latest value of the data source as a JSON object.
 */
// Store the latest value of the data source in memory.
let latestValue = 0;
source.subscribe((value) => (latestValue = value));

app.get("/poll", (_req, res) => {
  res.send({ value: latestValue });
});

/*
 * Approach 2: Long Polling (formerly known as Comet)
 *
 *  Keep the connection open until a new value is emitted by the data source.
 */
app.get("/long-poll", (_req, res) => {
  // Send a header indicating that the connection should stay alive
  // while we wait for a new value.
  res.set({
    Connection: "keep-alive",
    "Content-Type": "application/json",
  });
  res.flushHeaders();

  // Subscribe to a single event from the data source.
  const singleValueSubscription = source.pipe(take(1));

  singleValueSubscription.subscribe((value) => {
    res.write(JSON.stringify({ value }));
    res.end();
  });

  // No need to unsubscribe, since the take operator will close after a single event is emitted.
});

/*
 * Approach 3: Server-Sent Events
 *
 *  Stream the data source using Server-Sent Events.
 */
app.get("/sse", function (req, res) {
  // Send the headers to indicate that we are sending an SSE stream.
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const subscription = source.subscribe((value) =>
    // Send an SSE data event with the value when received.
    res.write(`data: ${JSON.stringify({ value })}\n\n`)
  );

  // When the request is closed, unsubscribe from the data source.
  req.on("close", () => subscription.unsubscribe());
});

app.use(express.static("static"));

// Listen for incoming connections.
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

/*
 * Approach 4: Websockets
 *
 * Establish a websocket server, sending a value through a message whenever one is available.
 */
// The noServer option represents that the ws library does not need to listen
// for incoming connections since we already have a server listening.
const wsServer = new WebSocketServer({ noServer: true });
wsServer.on("connection", async (socket) => {
  const subscription = source.subscribe((value) =>
    socket.send(JSON.stringify({ value }))
  );
  socket.on("close", () => subscription.unsubscribe());
});

// Handle websocket requests via the wsServer handler created above.
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
