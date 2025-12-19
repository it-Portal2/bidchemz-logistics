export const bidChemzAPILogistics = {
  dev: "http://localhost:3003/api/v1/logistics/webhook/shipment",
  stag: "https://staging-api.bidchemz.com/api/v1/logistics/webhook/shipment",
  prod: "https://api.bidchemz.com/api/v1/logistics/webhook/shipment",
};

type AppMode = "dev" | "stag" | "prod";

const getAppMode = (): AppMode => {
  const mode = process.env.MODE;
  if (mode === "dev" || mode === "stag" || mode === "prod") {
    return mode;
  }
  return "prod"; // Default to prod for safety
};

export const BIDCHEMZ_WEBHOOK_URL = bidChemzAPILogistics[getAppMode()];
