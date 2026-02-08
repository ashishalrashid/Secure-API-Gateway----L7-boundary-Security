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
  // 🚫 EXCLUDE observability endpoint
  if (req.path === "/metrics") {
    return next();
  }

  const start = Date.now();
  let inflightDecremented = false;

  gatewayInflightRequests.inc();

  const decrementInflight = () => {
    if (!inflightDecremented) {
      gatewayInflightRequests.dec();
      inflightDecremented = true;
    }
  };

  res.on("finish", decrementInflight);
  res.on("close", decrementInflight);
  res.on("error", decrementInflight);

  res.on("finish", () => {
    const tenantId = (req as any).tenant?.id ?? "unknown";
    const status = String(res.statusCode);

    gatewayRequestsTotal.inc({ tenantId, status });
    gatewayLatencyMs.observe(
      { tenantId, status },
      Date.now() - start
    );
  });

  next();
}
