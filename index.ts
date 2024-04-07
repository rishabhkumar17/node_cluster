import cluster, { Worker } from "cluster";
import express from "express";
import os, { CpuInfo } from "os";

const PORT = 9000;

interface Dict<T> {
  [key: string]: T;
}

interface Message {
  action: string;
}

function startWorker() {
  const worker = cluster.fork();

  worker.on('exit', () => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
}

function terminateWorkers() {
  for (const worker of Object.values(cluster.workers as NodeJS.Dict<Worker>)) {
    worker?.send({ action: 'terminate' });
  }
}

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  console.log(`CPU count ${os.cpus().length}`);

  for (let i = 0; i < os.cpus().length; i++) {
    startWorker();
  }

  setTimeout(() => {
    console.log('Terminating workers...');
    terminateWorkers();
  }, 10000);

} else {
  const app = express();

  app.get("/", (req, res) => {
    const result = factorial(50) * process.pid;
    const coreModel = getCoreIndex();
    // console.log(`Worker ${process.pid} (CPU Model ${coreModel}): Result of factorial calculation: ${result}`)
    res.status(200).send(`Worker ${process.pid} (CPU Model ${coreModel}): Result of factorial calculation: ${result}`);
  });

  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started at ${PORT}`);
  });

  process.on('message', (msg: any) => {
    if (msg && msg.action === 'terminate') {
      console.log(`Worker ${process.pid} received terminate message. Exiting...`);
      server.close(() => {
        process.exit();
      });
    }
  });

  function factorial(n: number): number {
    if (n === 0 || n === 1) {
      return 1;
    } else {
      return n * factorial(n - 1);
    }
  }

  function getCoreIndex(): string | undefined {
    const cpus = os.cpus();
    console.log(cpus)
    const currentCore = cpus.find(core => core?.times.user > 0 && core?.times.sys > 0);
    return currentCore?.model;
  }
}
