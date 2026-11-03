import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { CheckCircle2, HeartPulse, SearchX, WifiOff } from "lucide-react";
import { useGetCertificate, getGetCertificateQueryKey } from "../api/index.js";
import { Button } from "../components/ui/button.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { isNotFoundError, safeLearnerName } from "../lib/certificateVerification.js";
import { ONLINE_CERTIFICATE_DISCLAIMER, formatOnlineAwardDate } from "../lib/certificateTemplate.js";
import { countryLabel } from "../lib/trainingCountry.js";
function usePublicPageMeta(title) {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = title;
        let meta = document.querySelector('meta[name="robots"]');
        const created = !meta;
        const prevContent = meta?.getAttribute("content") ?? null;
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "robots";
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", "noindex, nofollow");
        return () => {
            document.title = prevTitle;
            if (created)
                meta?.remove();
            else if (prevContent !== null)
                meta?.setAttribute("content", prevContent);
        };
    }, [title]);
}
function Shell({ children }) {
    return (<div className="min-h-[100dvh] bg-[hsl(40_33%_97%)] flex flex-col">
      <div className="h-2 bg-[#16324a]"/>
      <header className="container mx-auto px-4 py-6 max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2" data-testid="link-home">
          <span className="bg-primary p-1.5 rounded-xl"><HeartPulse className="h-5 w-5 text-primary-foreground"/></span>
          <span className="font-serif font-semibold text-xl tracking-tight">Care Learn</span>
        </Link>
      </header>
      <main className="flex-1 container mx-auto px-4 pb-16 max-w-2xl">{children}</main>
    </div>);
}
export default function VerifyCertificate() {
    const params = useParams();
    const code = params.code ?? "";
    usePublicPageMeta("Verify a certificate | Care Learn");
    const { data, isLoading, isError, error, refetch, isFetching } = useGetCertificate(code, {
        query: {
            enabled: !!code,
            queryKey: getGetCertificateQueryKey(code),
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: true,
        },
    });
    const cert = data?.certificate;
    if (isLoading) {
        return (<Shell>
        <div role="status" aria-live="polite" className="rounded-2xl border bg-card p-8 space-y-4">
          <span className="sr-only">Checking certificate record...</span>
          <Skeleton className="h-6 w-48"/>
          <Skeleton className="h-10 w-3/4"/>
          <Skeleton className="h-5 w-2/3"/>
          <Skeleton className="h-5 w-1/3"/>
        </div>
      </Shell>);
    }
    if (!code || (isError && isNotFoundError(error))) {
        return (<Shell>
        <section role="alert" className="rounded-2xl border bg-card p-8 sm:p-10" data-testid="status-certificate-not-found">
          <SearchX className="w-10 h-10 text-[#16324a]/60 mb-4"/>
          <h1 className="font-serif text-3xl font-semibold mb-3">Certificate not found</h1>
          <p className="text-muted-foreground leading-relaxed">
            We couldn't find an issued Care Learn certificate matching this link. Check that the QR code or link was copied in full, or ask the certificate holder for a new copy.
          </p>
        </section>
      </Shell>);
    }
    if (isError || !cert) {
        return (<Shell>
        <section role="alert" className="rounded-2xl border bg-card p-8 sm:p-10" data-testid="status-certificate-unavailable">
          <WifiOff className="w-10 h-10 text-accent mb-4"/>
          <h1 className="font-serif text-3xl font-semibold mb-3">Unable to verify right now</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We couldn't reach the certificate records. This does not mean the certificate is invalid. Please try again in a moment.
          </p>
          <Button onClick={() => refetch()} disabled={isFetching} className="gap-2" data-testid="button-retry-verify">
            {isFetching ? "Checking..." : "Try again"}
          </Button>
        </section>
      </Shell>);
    }
    let issued = "";
    try {
        issued = cert.formatVersion === 1 ? formatOnlineAwardDate(cert.completedAt ?? cert.issuedAt)
            : format(new Date(cert.issuedAt), "d MMMM yyyy");
    }
    catch {
        issued = "";
    }
    return (<Shell>
      <section className="rounded-2xl border bg-card overflow-hidden" data-testid="status-certificate-verified">
        <div className="bg-primary/10 border-b border-primary/20 px-8 py-5 flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-primary shrink-0" aria-hidden="true"/>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-primary">Certificate verified</h1>
        </div>
        <dl className="px-8 py-8 space-y-6">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Awarded to</dt>
            <dd className="font-serif text-3xl font-semibold break-words" data-testid="text-verified-name">{safeLearnerName(data?.userName)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Course completed</dt>
            <dd className="text-lg font-medium break-words" data-testid="text-verified-course">{cert.courseTitle}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Date of award</dt>
            <dd className="text-lg" data-testid="text-verified-date">{issued}</dd>
          </div>
          {cert.formatVersion === 1 && <>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Training track</dt>
              <dd data-testid="text-verified-country">{countryLabel(cert.trainingCountry) ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Completed course version</dt>
              <dd className="font-mono text-sm break-all" data-testid="text-verified-version">{cert.courseVersion}</dd>
            </div>
          </>}
        </dl>
        <p className="px-8 pb-8 text-sm text-muted-foreground leading-relaxed">
          Care Learn has a matching issued certificate record. Compare the name, course{cert.formatVersion === 1 ? ", training track, course version" : ""} and date above with the printed certificate; if any detail differs, the copy you hold may have been altered.
        </p>
        {cert.formatVersion === 1 && <p className="px-8 pb-8 text-xs text-muted-foreground">{ONLINE_CERTIFICATE_DISCLAIMER}</p>}
      </section>
    </Shell>);
}
