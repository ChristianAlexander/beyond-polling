document.addEventListener("DOMContentLoaded", function (_event) {
  const app = document.getElementById("app");

  // Polling
  const pollingElement = document.createElement("li");
  pollingElement.textContent = "Polling";
  app.appendChild(pollingElement);

  async function poll() {
    const response = await fetch("/poll");
    const body = await response.json();

    pollingElement.textContent = `Polling: ${body.value}`;
    setTimeout(poll, 1000);
  }
  poll();

  // Long polling
  const longPollingElement = document.createElement("li");
  longPollingElement.textContent = "Long Polling";
  app.appendChild(longPollingElement);

  async function longPoll() {
    const response = await fetch("/long-poll");
    const body = await response.json();

    longPollingElement.textContent = `Long Polling: ${body.value}`;
    // Use setTimeout of 0 to safely perform tail recursion without growing the stack.
    setTimeout(longPoll, 0);
  }
  longPoll();

  // Server-Sent Events
  const sseElement = document.createElement("li");
  sseElement.textContent = "SSE";
  app.appendChild(sseElement);

  const eventSource = new EventSource("/sse");
  eventSource.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    sseElement.textContent = `SSE: ${data.value}`;
  });

  // WebSocket
  const wsElement = document.createElement("li");
  wsElement.textContent = "WebSocket";
  app.appendChild(wsElement);

  const protocol = window.location.protocol === "https" ? "wss" : "ws";
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    wsElement.textContent = `WebSocket: ${data.value}`;
  });
});
