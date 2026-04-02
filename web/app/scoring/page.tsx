import ScoringClient from "./ScoringClient";

export default function ScoringPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Run Scoring</h1>
      <p className="text-gray-500 text-sm mb-6">
        Triggers <code className="bg-gray-100 px-1 rounded text-xs">jobs/run_inference.py</code>,
        which loads the latest trained model and writes late-delivery predictions
        for all unfulfilled orders into <code className="bg-gray-100 px-1 rounded text-xs">order_predictions</code>.
        The warehouse priority queue will reflect the new scores immediately.
      </p>
      <ScoringClient />
    </div>
  );
}
