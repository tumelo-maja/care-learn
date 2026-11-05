/** Development diagnostics belong to administrators, never learner certificate UI. */
export function CertificateDevelopmentNotice({ isAdmin, developmentBuild = import.meta.env.DEV }) {
    if (!developmentBuild || isAdmin !== true)
        return null;
    return (<p role="note" className="mx-auto mt-4 max-w-[520px] rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground" data-testid="text-dev-qr-warning">
        Preview build: the QR code points to this development address. Publish the app, then download certificates again before sharing permanent verification links.
      </p>);
}
