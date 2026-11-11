"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/result";

type Options<O> = {
  /** Shown as a toast when the action succeeds. Falls back to the action's own message. */
  successMessage?: string;
  onSuccess?: (data: O) => void;
  /** Set to false when the form shows the error itself. */
  toastOnError?: boolean;
};

/**
 * Runs a server action from a client component and keeps track of what the
 * form needs: whether it is pending, the general error, and per-field errors.
 * What the person typed is never cleared on failure.
 */
export function useAction<I, O>(action: (input: I) => Promise<ActionResult<O>>, options: Options<O> = {}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { successMessage, onSuccess, toastOnError = true } = options;

  const run = useCallback(
    (input: I) => {
      setError(null);
      setFieldErrors({});
      startTransition(async () => {
        let result: ActionResult<O>;
        try {
          result = await action(input);
        } catch {
          result = { ok: false, error: "Bağlantı kurulamadı. Yazdıkların yerinde duruyor; tekrar dene." };
        }
        if (result.ok) {
          const message = successMessage ?? result.message;
          if (message) toast(message);
          onSuccess?.(result.data);
        } else {
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          if (toastOnError) toast(result.error, "error");
        }
      });
    },
    [action, onSuccess, successMessage, toastOnError],
  );

  return { run, pending, error, fieldErrors };
}
