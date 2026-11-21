import type { Database as GeneratedDatabase } from "./database";

/*
 * Corrections on top of the generated types (src/types/database.ts is overwritten by
 * `npm run db:types`, so fixes live here).
 *
 * The generator types every SQL function argument as required and non-null. Arguments that
 * legitimately accept NULL are widened below.
 */
type PublicSchema = GeneratedDatabase["public"];
type Functions = PublicSchema["Functions"];

type FunctionOverrides = {
  /** p_from / p_to = null means no lower / upper date bound. */
  add_time_to_invoice: {
    Args: Omit<Functions["add_time_to_invoice"]["Args"], "p_from" | "p_to"> & {
      p_from: string | null;
      p_to: string | null;
    };
    Returns: Functions["add_time_to_invoice"]["Returns"];
  };
  /** p_notes = null: no notes. */
  record_payment: {
    Args: Omit<Functions["record_payment"]["Args"], "p_notes"> & { p_notes: string | null };
    Returns: Functions["record_payment"]["Returns"];
  };
  /** p_project_id = null creates a new project. */
  save_project: {
    Args: Omit<Functions["save_project"]["Args"], "p_project_id"> & { p_project_id: string | null };
    Returns: Functions["save_project"]["Returns"];
  };
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<PublicSchema, "Functions"> & {
    Functions: Omit<Functions, keyof FunctionOverrides> & FunctionOverrides;
  };
};
