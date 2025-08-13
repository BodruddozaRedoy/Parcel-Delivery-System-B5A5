export const generateTrackingId = (): string => {
  const random = Math.floor(100000 + Math.random() * 900000);

  const now = new Date();
  const isoString: string = now.toISOString();
  const [datePart = "19700101"] = isoString.split("T"); // default fallback
  const date = datePart.replace(/-/g, "");

  return `TRK-${date}-${random}`;
};