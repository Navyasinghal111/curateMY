type OperationalValue = boolean | number | string | null | string[]

// Server-side signals for operational work. Keep these deliberately bounded:
// outcomes and diagnostic codes are useful; customer data and credentials are not.
export function operationalLog(
  event: string,
  details: Record<string, OperationalValue>
) {
  console.info(`[curatekin:${event}]`, JSON.stringify({
    event,
    at: new Date().toISOString(),
    ...details,
  }))
}
