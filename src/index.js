const WebSocket = require("ws");
const prompt = require("prompt-sync")({ sigint: true });
const dotenv = require("dotenv");

dotenv.config();

var cookie = process.env.COOKIE;

var url = `wss://${process.env.ARGOCD_DOMAIN}/terminal?pod=${process.env.POD}&container=${process.env.CONTAINER}&appName=${process.env.APP_NAME}&appNamespace=${process.env.APP_NAMESPACE}&projectName=${process.env.PROJECT_NAME}&namespace=${process.env.NAMESPACE}`;

const ws = new WebSocket(url, { headers: { Cookie: cookie } });

var SHELL_PROMPTS = process.env.SHELL_PROMPTS.split(",");

var isPrompt = (data) => {
  var prompts = SHELL_PROMPTS;

  for (var i = 0; i < prompts.length; i++) {
    if (data.includes(prompts[i])) {
      return true;
    }
  }

  return false;
};

ws.on("open", function open() {
  console.log("open ws connection...");
});

ws.on("message", function message(data) {
  // console.log('raw', data.toString());
  var evt = JSON.parse(data.toString());
  if (evt.operation == "stdout") {
    if (isPrompt(evt.data)) {
      var cmd = prompt(`${evt.data}`);
      var sending = { operation: "stdin", data: cmd + "\r", cols: 0, rows: 0 };
      ws.send(JSON.stringify(sending));
    } else {
      console.log(evt.data);
    }
  }
});
