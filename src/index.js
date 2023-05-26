const WebSocket = require("ws");
const prompt = require("prompt-sync")({ sigint: true, eot: true });
const dotenv = require("dotenv");

dotenv.config();

var cookie = process.env.COOKIE;

var url = `wss://${process.env.ARGOCD_DOMAIN}/terminal?pod=${process.env.POD}&container=${process.env.CONTAINER}&appName=${process.env.APP_NAME}&appNamespace=${process.env.APP_NAMESPACE}&projectName=${process.env.PROJECT_NAME}&namespace=${process.env.NAMESPACE}`;

var SHELL_PROMPTS = process.env.SHELL_PROMPTS.split(",");
var reconnectInterval = 1_000;
var ws;

var isPrompt = (data) => {
  var prompts = SHELL_PROMPTS;

  for (var i = 0; i < prompts.length; i++) {
    if (data.includes(prompts[i])) {
      return true;
    }
  }

  return false;
};

var connect = function () {
  ws = new WebSocket(url, { headers: { Cookie: cookie } });

  ws.on("open", function () {
    console.log("open ws...");
  });

  ws.on("error", function () {
    console.log("error ws");
  });

  ws.on("close", function () {
    console.log("re-connect ws...");
    setTimeout(connect, reconnectInterval);
  });

  ws.on("message", function message(data) {
    var evt = JSON.parse(data.toString());
    if (evt.operation == "stdout") {
      if (isPrompt(evt.data)) {
        var cmd = prompt(`${evt.data}`);
        var sending = {
          operation: "stdin",
          data: cmd + "\r",
          cols: 0,
          rows: 0,
        };
        ws.send(JSON.stringify(sending));
      } else {
        process.stdout.write(evt.data);
      }
    }
  });
};

connect();
