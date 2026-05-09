#!/usr/bin/env node
// Run from repo root: node program/scripts/get-oracle-pda.js
// Or from program/: node scripts/get-oracle-pda.js
import { PublicKey } from "@solana/web3.js";

const fallbackProgramId = "7SjPCZFdcXPe2Z79eCJX2VtCrKLoqdhHYcYxaNxEjM9f";
const rawProgramId = process.env.ORACLE_PROGRAM_ID ?? process.argv[2] ?? fallbackProgramId;
const oracleProgramId = new PublicKey(rawProgramId);

const [oraclePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("oracle_state")],
  oracleProgramId
);
console.log("ORACLE_STATE_PUBKEY=" + oraclePda.toBase58());
