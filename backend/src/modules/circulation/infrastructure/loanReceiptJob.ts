import type { RedisClient } from "bun";
import { emailSender } from "../../../infrastructure/email";
import { sql } from "../../../infrastructure/postgres";
import { enqueue, queue, type Job } from "../../../infrastructure/queue";
import { redisKey } from "../../../infrastructure/redis";
import { PostgresCirculationLookup } from "../../../integration/PostgresCirculationLookup";
import type { EmailSender } from "../../../shared/EmailSender";
import { receiptEmail } from "./receiptEmail";

export const LOAN_RECEIPT_STREAM = redisKey("circulacao", "fila", "comprovantes");

export type LoanReceiptTask = { loanId: number };

export type ReceiptOutcome = "enviado" | "já enviado" | "empréstimo não encontrado" | "sem remetente";

type LoanRecord = {
  id: number;
  readerId: number;
  copyId: number;
  loanedOn: string;
  dueOn: string;
  sentAt: Date | null;
};

export async function sendLoanReceipt(loanId: number, sender: EmailSender | null = emailSender): Promise<ReceiptOutcome> {
  if (!sender) return "sem remetente";

  const [loan] = await sql<LoanRecord[]>`
    SELECT id, leitor_id AS "readerId", exemplar_id AS "copyId",
           data_emprestimo AS "loanedOn", data_prevista_devolucao AS "dueOn",
           comprovante_enviado_em AS "sentAt"
    FROM emprestimos
    WHERE id = ${loanId}
  `;

  if (!loan) return "empréstimo não encontrado";
  if (loan.sentAt) return "já enviado";

  const lookup = new PostgresCirculationLookup(sql);
  const reader = await lookup.reader(loan.readerId);
  const copy = await lookup.copy(loan.copyId);
  if (!reader || !copy) return "empréstimo não encontrado";

  const email = receiptEmail({
    loanId: loan.id,
    readerName: reader.name,
    readerEmail: reader.email,
    bookTitle: copy.bookTitle,
    registrationNumber: copy.registrationNumber,
    loanedOn: loan.loanedOn,
    dueOn: loan.dueOn,
  });

  await sender.send(email);
  await sql`UPDATE emprestimos SET comprovante_enviado_em = NOW() WHERE id = ${loanId}`;

  return "enviado";
}

export async function scheduleLoanReceipt(
  loanId: number,
  { client = queue, sender = emailSender }: { client?: RedisClient | null; sender?: EmailSender | null } = {},
): Promise<void> {
  const enqueued = await enqueue(LOAN_RECEIPT_STREAM, { loanId }, client);
  if (enqueued) return;

  try {
    await sendLoanReceipt(loanId, sender);
  } catch (error) {
    console.warn("Falha ao enviar comprovante:", (error as Error).message);
  }
}

export function loanReceiptJob(sender: EmailSender | null = emailSender): Job<LoanReceiptTask> {
  return {
    stream: LOAN_RECEIPT_STREAM,
    async handle(task) {
      if (!task || typeof task.loanId !== "number" || !Number.isInteger(task.loanId)) {
        throw new Error("sem o id do empréstimo");
      }
      const outcome = await sendLoanReceipt(task.loanId, sender);
      console.log(`Comprovante do empréstimo ${task.loanId}: ${outcome}`);
    },
  };
}
