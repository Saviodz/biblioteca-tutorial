import type { CirculationLookup } from "../src/modules/circulation/domain/CirculationLookup";
import type { CirculationRepository, Filters } from "../src/modules/circulation/domain/CirculationRepository";
import type { CirculationUseCase } from "../src/modules/circulation/domain/CirculationUseCase";
import type { Loan } from "../src/modules/circulation/domain/Loan";
import type { Reservation } from "../src/modules/circulation/domain/Reservation";
import type { Clock } from "../src/shared/Clock";

export class InMemoryCirculationRepository implements CirculationRepository {
  readonly savedReservations: Reservation[] = [];
  readonly savedLoans: Loan[] = [];
  async reservations(filters: Filters = {}) {
    return this.savedReservations.filter(r => (!filters.readerId || r.readerId === filters.readerId) && (!filters.copyId || r.copyId === filters.copyId));
  }
  async loans(filters: Filters = {}) {
    return this.savedLoans.filter(l => (!filters.readerId || l.readerId === filters.readerId) && (!filters.copyId || l.copyId === filters.copyId));
  }
  async insertReservation(data: Omit<Reservation, "id">) {
    const reservation = { ...data, id: this.savedReservations.length + 1 };
    this.savedReservations.push(reservation); return reservation;
  }
  async setReservationStatus(id: number, status: "cancelada" | "atendida") { this.savedReservations.find(r => r.id === id)!.status = status; }
  async insertLoan(data: Omit<Loan, "id">) {
    const loan = { ...data, id: this.savedLoans.length + 1 };
    this.savedLoans.push(loan); return loan;
  }
  async returnLoan(id: number, date: string) { this.savedLoans.find(l => l.id === id)!.returnedOn = date; }
}

export function scenario() {
  const memory = new InMemoryCirculationRepository();
  const time = { now: "2026-10-15T12:00:00Z" };
  const lookup: CirculationLookup = {
    reader: async id => id <= 10 ? { id, name: `Leitor ${id}`, cpf: "52998224725", email: `leitor${id}@exemplo.com` } : null,
    copy: async id => id <= 20 ? { id, bookTitle: `Livro ${id}`, registrationNumber: `2026-${String(id).padStart(6, "0")}` } : null,
  };
  function create<T extends CirculationUseCase>(UseCase: new (r: CirculationRepository, l: CirculationLookup, clock: Clock) => T): T {
    return new UseCase(memory, lookup, () => new Date(time.now));
  }
  return { memory, time, create };
}
