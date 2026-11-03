import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, } from "../components/ui/alert-dialog.jsx";
const ConfirmationContext = createContext(null);
export function ConfirmationProvider({ children }) {
    const [options, setOptions] = useState(null);
    const pending = useRef(null);
    const confirm = useCallback((next) => {
        if (pending.current)
            return Promise.resolve(false);
        return new Promise((resolve) => {
            pending.current = resolve;
            setOptions(next);
        });
    }, []);
    const settle = useCallback((accepted) => {
        const resolve = pending.current;
        pending.current = null;
        setOptions(null);
        resolve?.(accepted);
    }, []);
    useEffect(() => () => {
        pending.current?.(false);
        pending.current = null;
    }, []);
    const Icon = options?.destructive ? AlertTriangle : RotateCcw;
    return (<ConfirmationContext.Provider value={confirm}>
      {children}
      <AlertDialog open={!!options} onOpenChange={(open) => { if (!open)
        settle(false); }}>
        <AlertDialogContent className="w-[92vw] max-w-md rounded-2xl p-6 sm:rounded-2xl" data-testid="confirmation-modal">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${options?.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Icon className="h-6 w-6" aria-hidden="true"/>
          </div>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-serif text-2xl">{options?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">{options?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => settle(false)} data-testid="button-confirmation-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => settle(true)} className={options?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined} data-testid="button-confirmation-accept">
              {options?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>);
}
export function useConfirmation() {
    const confirm = useContext(ConfirmationContext);
    if (!confirm)
        throw new Error("useConfirmation must be used within ConfirmationProvider");
    return confirm;
}
