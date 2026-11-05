import { invalidateAuthorSearch } from "../modules/authorship";
import { invalidateReaderSearch } from "../modules/readers";

/**
 * Os dados derivados do Redis podem ter ficado para trás: o servidor esteve
 * parado enquanto o banco mudou, ou o seed escreveu direto nas tabelas.
 * Recalcula tudo a partir do Postgres, a fonte da verdade.
 */
export async function refreshDerivedData(): Promise<void> {
  await invalidateAuthorSearch();
  await invalidateReaderSearch();
}
