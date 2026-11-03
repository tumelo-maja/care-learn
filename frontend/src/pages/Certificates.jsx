import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { formatOnlineAwardDate } from "../lib/certificateTemplate.js";
import { Award, ShieldCheck } from "lucide-react";
import { useGetMyCertificates, getGetMyCertificatesQueryKey } from "../api/index.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card } from "../components/ui/card.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { CertificatePreviewDialog } from "../components/certificates/CertificatePreviewDialog.jsx";
export default function Certificates() {
    const { isSignedIn: isAuthenticated } = useAuth();
    const [selectedCertCode, setSelectedCertCode] = useState(null);
    const { data, isLoading, error } = useGetMyCertificates({
        query: { queryKey: getGetMyCertificatesQueryKey(), enabled: isAuthenticated },
    });
    if (error)
        return <AppLayout><p role="alert" className="p-10 text-center">Your certificates could not be loaded. Please reload to try again.</p></AppLayout>;
    return (<AppLayout>
      <div className="bg-slate-900 text-slate-50 py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Award className="w-16 h-16 text-accent mx-auto mb-6 opacity-90"/>
          <h1 className="text-4xl font-serif font-bold mb-4">Your Certificates</h1>
          <p className="text-lg text-slate-300">
            Download and save your certificates to build your professional care portfolio.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {isLoading ? (<div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl"/>)}
          </div>) : (data?.certificates ?? []).length === 0 ? (<div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
            <p className="text-muted-foreground mb-6">Complete courses to earn your certificates.</p>
            <Button asChild><Link href="/my-learning">Go to My Learning</Link></Button>
          </div>) : (<div className="space-y-6">
            {(data?.certificates ?? []).map(cert => (<Card key={cert.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 hover:shadow-lg transition-all duration-300 border-border/60 bg-card overflow-hidden relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary"/>
                <div className="bg-primary/10 p-5 rounded-2xl shrink-0">
                  <Award className="w-10 h-10 text-primary"/>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{cert.formatVersion === 1 ? "Certificate of Online Course Completion" : "Certificate of Completion"}</p>
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-2">{cert.courseTitle}</h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                    <span>Issued: {cert.formatVersion === 1 ? formatOnlineAwardDate(cert.completedAt ?? cert.issuedAt)
                    : format(new Date(cert.issuedAt), 'MMMM do, yyyy')}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                  <Button className="gap-2 bg-primary shadow-md shadow-primary/20" onClick={() => setSelectedCertCode(cert.certificateCode)} data-testid={`button-download-certificate-${cert.id}`}>
                    Download PDF
                  </Button>
                </div>
              </Card>))}
          </div>)}
      </div>

      <CertificatePreviewDialog code={selectedCertCode} onClose={() => setSelectedCertCode(null)}/>
    </AppLayout>);
}
