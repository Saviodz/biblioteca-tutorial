import { queue, work } from "./infrastructure/queue";
import { catalogIntegration } from "./integration/catalogIntegration";
import { bookIndexJob } from "./modules/catalog";
import { loanReceiptJob } from "./modules/circulation";

if (!queue) throw new Error("QUEUE_URL não definida: o worker só existe junto da fila");

const consumer = process.env.HOSTNAME ?? `worker-${process.pid}`;
console.log(`Worker ${consumer} esperando tarefas`);

await work([bookIndexJob(catalogIntegration), loanReceiptJob()], { client: queue, consumer });
process.exit(0);
