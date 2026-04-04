#!/usr/bin/env python3
"""Write order_predictions for unfulfilled orders (Postgres / Supabase).

Maps order.risk_score to a synthetic late-delivery score for the warehouse UI.
Replace with a real model in production.

  export DATABASE_URL="postgresql://..."
  pip install -r jobs/requirements.txt
  python3 jobs/run_inference.py
"""

from __future__ import annotations

import os
import sys


def main() -> None:
    try:
        import psycopg
    except ImportError:
        print("Install: pip install -r jobs/requirements.txt", file=sys.stderr)
        sys.exit(1)

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is required", file=sys.stderr)
        sys.exit(1)

    sql = """
    INSERT INTO order_predictions (
      order_id,
      late_delivery_probability,
      predicted_late_delivery,
      prediction_timestamp
    )
    SELECT
      o.order_id,
      LEAST(1.0, GREATEST(0.0, o.risk_score / 100.0)),
      CASE WHEN o.risk_score >= 50 THEN 1 ELSE 0 END,
      NOW()
    FROM orders o
    LEFT JOIN shipments s ON s.order_id = o.order_id
    WHERE s.shipment_id IS NULL
    ON CONFLICT (order_id) DO UPDATE SET
      late_delivery_probability = EXCLUDED.late_delivery_probability,
      predicted_late_delivery = EXCLUDED.predicted_late_delivery,
      prediction_timestamp = EXCLUDED.prediction_timestamp
    RETURNING order_id;
    """

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
        conn.commit()

    print(f"Inference complete. Predictions written: {len(rows)}")


if __name__ == "__main__":
    main()
