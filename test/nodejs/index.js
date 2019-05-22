const Serialport = require("serialport");
const Board = require("firmata");
const sleep = require("sleep-async")().Promise;
const baud = 56700;
const path = "/dev/cu.wchusbserial1420"; // Wemos D1 R32
// const path = "/dev/cu.usbmodem14201"; // Arduino Leonardo

const tests = [];

for (let pin = 2; pin <= 13; pin++) {
  const f = (function(pin) {
    return async function() {
      return new Promise(resolve => {
        let count = 4;
        let state = 1;
        const timer = setInterval(async () => {
          await digitalWrite(pin, state);
          state = 1 - state;
          if (--count === 0) {
            clearInterval(timer);
            resolve();
          }
        }, 500);
      });
    };
  })(pin);

  tests.push(f);
}

async function times(n, job) {
  return new Promise(async resolve => {
    while (n) {
      await job();
      n--;
    }
    resolve();
  });
}

tests.push(async () => {
  digitalRead(3);
  await times(5, async () => {
    await digitalWrite(2, 1);
    await sleep.sleep(500);
    await digitalWrite(2, 0);
    await sleep.sleep(500);
  });
});

let firmata;

const port = new Serialport(path, {
  autoOpen: false,
  baudRate: baud
});

port.on("open", () => {
  console.log("firmata connected");
  firmata = new Board(port);
  firmata.on("ready", async () => {
    console.log("firmata ready, testing...");

    async function next() {
      if (tests.length === 0) {
        return Promise.resolve();
      }
      const test = tests.shift();
      return test().then(next);
    }
    await next();

    console.log("DONE");
  });
});

port.on("close", () => {
  console.log("firmata disconnected");
  process.exit(0);
});

port.open(err => {
  if (err) {
    console.error("firmata failed to open port " + path);
  }
});

async function digitalRead(pin, listener) {
  firmata.pinMode(pin, firmata.MODES.ANALOG);
  firmata.digitalRead(pin, value => {
    listener && listener(value);
    console.log("firmata digital pin " + pin + " changed " + value);
  });
}

async function analogRead(pin, listener) {
  firmata.pinMode(pin, firmata.MODES.ANALOG);
  firmata.analogRead(pin, value => {
    listener && listener(value);
    console.log("firmata analog pin " + pin + " changed " + value);
  });
}

async function digitalWrite(pin, value) {
  console.log("firmata digitalWrite", pin, value);
  return new Promise(resolve => {
    firmata.pinMode(pin, firmata.MODES.OUTPUT);
    firmata.digitalWrite(pin, value);
    resolve();
  });
}

async function analogWrite(pin, value) {
  console.log("firmata analogWrite", pin, value);
  return new Promise(resolve => {
    firmata.pinMode(pin, firmata.MODES.ANALOG);
    firmata.analogWrite(pin, value);
    resolve();
  });
}

async function pwmWrite(pin, value) {
  console.log("firmata pwmWrite", pin, value);
  return new Promise(resolve => {
    firmata.pinMode(pin, firmata.MODES.PWM);
    firmata.analogWrite(pin, value);
    resolve();
  });
}

async function servoWrite(pin, value) {
  console.log("firmata servoWrite", pin, value);
  return new Promise(resolve => {
    firmata.pinMode(pin, firmata.MODES.SERVO);
    firmata.servoWrite(pin, value);
    resolve();
  });
}
