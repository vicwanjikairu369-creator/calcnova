import { traceExpression } from '@/lib/math/steps';

interface Props {
  expression: string;
  angleMode: 'deg' | 'rad';
}

export function StepsPanel({ expression, angleMode }: Props) {
  const result = traceExpression(expression, { angleMode });

  if (!result.ok) {
    return <p className="text-sm text-red-500">{result.error}</p>;
  }
  if (result.steps.length === 0) {
    return (
      <p className="text-sm text-navy-500 dark:text-navy-400">
        No intermediate steps — this expression has no sub-operations to reduce.
      </p>
    );
  }

  return (
    <ol className="space-y-2" aria-label="Calculation steps">
      {result.steps.map((step, i) => (
        <li key={i} className="text-sm">
          <div className="font-mono text-navy-700 dark:text-navy-200">{step.before}</div>
          <div className="ml-3 font-mono text-violet-700 dark:text-violet-300">
            → {step.after}
            <span className="ml-2 text-xs text-navy-400">({step.note})</span>
          </div>
        </li>
      ))}
    </ol>
  );
}