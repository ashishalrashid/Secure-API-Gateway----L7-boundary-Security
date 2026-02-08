import { Request, Response, NextFunction } from "express";
import {
  gatewayRequestsTotal,
  gatewayLatencyMs,
  gatewayInflightRequests,
} from "./metrics";

export function requestMetrics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();
  let inflightDecremented = false;

  gatewayInflightRequests.inc();

  const decrementInflight = () => {
    if (!inflightDecremented) {
      gatewayInflightRequests.dec();
      inflightDecremented = true;
    }
  };

  // Normal completion
  res.on("finish", () => {
    decrementInflight();

    const tenantId = (req as any).tenantId ?? "unknown";
    const status = String(res.statusCode);

    gatewayRequestsTotal.inc({ tenantId, status });
    gatewayLatencyMs.observe(
      { tenantId, status },
      Date.now() - start
    );
  });

  // Aborted / errored connection
  res.on("close", () => {
    decrementInflight();
  });

  next();
}
