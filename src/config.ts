// Normalize API URL - remove trailing slashes to prevent double slashes in URLs.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.casino.qdogeonqubic.com"
).replace(/\/+$/, "");

// Casino owner public ID (60-character Qubic identity)
export const CASINO_OWNER_PUBLIC_ID = process.env.NEXT_PUBLIC_CASINO_OWNER_PUBLIC_ID || "CRMFYRPPCBJKVBBKKTCVDRTHPHOBWDIMCADKIQRAMFHGIJIPYRQNTHQEQBNA"

// Qubic Explorer URL
export const QUBIC_EXPLORER_URL = "https://explorer.qubic.org/network/tx/"
