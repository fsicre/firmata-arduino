const Serialport = require("serialport");
const Board = require("firmata");

let port, board, retries, connecting;

port = new Serialport(store.firmata.port, {
    autoOpen: false,
    baudRate: store.firmata.baud
  });
  port.on("open", () => {
    console.log("firmata connected");
    connecting = false;
    retries = 3;

    board = new Board(port);
    board.on("ready", () => {
      console.log("firmata started");
      store.firmata.status = "connected";
      firmata.send();

      store.firmata.watchDigital.forEach(firmata.digitalRead);
      store.firmata.watchAnalog.forEach(firmata.analogRead);

      modules.forEach(async module => await module.start());
    });
  });
  port.on("close", () => {
    console.log("firmata disconnected");
    store.firmata.status = "disconnected";
    firmata.send();
    again();
  });
  port.open(err => {
    if (err) {
      console.error("firmata failed to open port " + store.firmata.port);
      again();
    }
    resolve();
  });
});