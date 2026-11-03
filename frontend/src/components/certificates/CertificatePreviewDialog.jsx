import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useGetCertificate, getGetCertificateQueryKey } from "@workspace/api-client-react";
import { Button } from "../ui/button.jsx";
import { Skeleton } from "../ui/skeleton.jsx";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog.jsx";
import { useToast } from "../../hooks/use-toast.js";
import { currentVerificationUrl } from "../../lib/certificateVerification.js";
import { buildCertificateHtml, CERT_PX_HEIGHT, CERT_PX_WIDTH } from "../../lib/certificateTemplate.js";
function waitForFrame(frame) {
    return new Promise((resolve, reject) => {
        const ready = () => frame.contentDocument?.readyState === "complete" &&
            !!frame.contentDocument.querySelector(".sheet");
        if (ready())
            return resolve();
        const cleanup = () => {
            clearTimeout(timeout);
            frame.removeEventListener("load", onLoad);
        };
        const onLoad = () => {
            if (!ready())
                return;
            cleanup();
            resolve();
        };
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Certificate document did not finish loading."));
        }, 10000);
        frame.addEventListener("load", onLoad);
    });
}
function PreviewBody({ code, onClose }) {
    const { toast } = useToast();
    const { data, isLoading, isError, refetch, isFetching } = useGetCertificate(code, {
        query: { enabled: !!code, queryKey: getGetCertificateQueryKey(code) },
    });
    const cert = data?.certificate;
    const { html, qrError } = useMemo(() => {
        if (!cert)
            return { html: "", qrError: null };
        try {
            return {
                html: buildCertificateHtml({
                    learnerName: data?.userName ?? "",
                    courseTitle: cert.courseTitle,
                    issuedAt: cert.issuedAt,
                    verificationUrl: currentVerificationUrl(cert.certificateCode),
                    formatVersion: cert.formatVersion,
                    trainingCountry: cert.trainingCountry,
                    courseVersion: cert.courseVersion,
                    completedAt: cert.completedAt,
                }),
                qrError: null,
            };
        }
        catch {
            return { html: "", qrError: "We couldn't generate the verification QR code for this certificate. Please try again." };
        }
    }, [cert, data?.userName]);
    const frameRef = useRef(null);
    const boxRef = useRef(null);
    const [scale, setScale] = useState(0.5);
    const [printing, setPrinting] = useState(false);
    const [printError, setPrintError] = useState(null);
    useEffect(() => {
        const el = boxRef.current;
        if (!el)
            return;
        const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / CERT_PX_WIDTH)));
        ro.observe(el);
        return () => ro.disconnect();
    }, [html]);
    async function handlePrint() {
        setPrintError(null);
        const frame = frameRef.current;
        const win = frame?.contentWindow;
        if (!frame || !win) {
            const msg = "The certificate isn't ready yet. Please wait a moment and try again.";
            setPrintError(msg);
            toast({ title: "Couldn't open print", description: msg, variant: "destructive" });
            return;
        }
        setPrinting(true);
        try {
            await waitForFrame(frame);
            const fonts = frame.contentDocument?.fonts;
            if (fonts)
                await Promise.race([fonts.ready, new Promise((r) => setTimeout(r, 3000))]);
            win.focus();
            win.print();
        }
        catch {
            const msg = "We couldn't prepare the certificate for printing. Please try again, or use a different browser.";
            setPrintError(msg);
            toast({ title: "Printing was blocked", description: msg, variant: "destructive" });
        }
        finally {
            setPrinting(false);
        }
    }
    return (<>
      <div className="px-6 pt-6 pb-3 pr-12 border-b bg-background">
        <DialogTitle className="font-serif text-2xl">{cert?.formatVersion === 1 ? "Certificate of Online Course Completion" : "Certificate of Completion"}</DialogTitle>
        <DialogDescription className="mt-1">
          {cert ? cert.courseTitle : isError ? "We couldn't load this certificate." : "Preparing your A4 certificate..."}
        </DialogDescription>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-[hsl(200_30%_94%)] px-4 py-5 sm:px-8">
        {isLoading || (!cert && isFetching) ? (<Skeleton className="mx-auto w-full max-w-[520px] aspect-[210/297] rounded-sm"/>) : qrError ? (<div role="alert" className="mx-auto max-w-sm text-center py-14" data-testid="text-qr-error">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3"/>
            <p className="font-medium">{qrError}</p>
          </div>) : isError || !cert ? (<div role="alert" className="mx-auto max-w-sm text-center py-14">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3"/>
            <p className="font-medium mb-4">Something went wrong loading your certificate.</p>
            <Button variant="outline" onClick={() => refetch()} className="gap-2" data-testid="button-retry-certificate">
              Try again
            </Button>
          </div>) : (<div ref={boxRef} className="mx-auto w-full max-w-[520px]">
            <div className="relative overflow-hidden shadow-xl ring-1 ring-black/5" style={{ width: CERT_PX_WIDTH * scale, height: CERT_PX_HEIGHT * scale }}>
              <iframe ref={frameRef} title="Certificate document" srcDoc={html} sandbox="allow-same-origin allow-modals" data-testid="iframe-certificate-preview" style={{
                width: CERT_PX_WIDTH,
                height: CERT_PX_HEIGHT,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
            }}/>
            </div>
          </div>)}
        {import.meta.env.DEV && cert && !qrError && (<p role="note" className="mx-auto mt-4 max-w-[520px] rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground" data-testid="text-dev-qr-warning">
            Preview build: the QR code points to this development address. Publish the app, then download certificates again before sharing permanent verification links.
          </p>)}
        {printError && (<p role="alert" className="mt-4 text-sm text-destructive text-center" data-testid="text-print-error">{printError}</p>)}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end px-6 py-4 border-t bg-background">
        <Button variant="outline" onClick={onClose} data-testid="button-close-certificate">Close</Button>
        <Button onClick={handlePrint} disabled={!cert || !html || printing} className="gap-2" data-testid="button-save-certificate-pdf">
          {printing ? "Preparing..." : "Save as PDF"}
        </Button>
      </div>
    </>);
}
export function CertificatePreviewDialog({ code, onClose }) {
    return (<Dialog open={!!code} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col max-h-[90dvh] overflow-hidden">
        {code && <PreviewBody code={code} onClose={onClose}/>}
      </DialogContent>
    </Dialog>);
}
