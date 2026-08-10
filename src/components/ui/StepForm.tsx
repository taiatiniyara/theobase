import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface Step {
  title: string;
  content: ReactNode;
  validate?: () => boolean;
}

interface StepFormProps {
  steps: Step[];
  onFinish: () => void;
  onCancel?: () => void;
  className?: string;
}

export function StepForm({ steps, onFinish, onCancel, className = "" }: StepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLast = currentStep === steps.length - 1;

  function handleNext() {
    const step = steps[currentStep];
    if (step?.validate && !step.validate()) return;
    if (isLast) {
      onFinish();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className={className}>
      {/* Progress indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i < currentStep
                  ? "bg-brand text-white"
                  : i === currentStep
                    ? "border-2 border-brand bg-white text-brand"
                    : "border-2 border-gray-200 bg-white text-gray-400"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm ${i <= currentStep ? "font-medium text-gray-900" : "text-gray-400"}`}
            >
              {step.title}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${i < currentStep ? "bg-brand" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mb-6">{steps[currentStep]?.content}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">
            Step {currentStep + 1} of {steps.length}
          </Badge>
          {currentStep > 0 && (
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button onClick={handleNext}>{isLast ? "Finish" : "Next"}</Button>
        </div>
      </div>
    </div>
  );
}
