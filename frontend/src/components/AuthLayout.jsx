export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 relative overflow-hidden">
      {/* Faint brass ledger-rule texture in the background — quiet, not decorative noise */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, #B7893F 39px, #B7893F 40px)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display text-3xl text-paper tracking-wide">Vaultivo</span>
          <p className="text-paper/50 text-sm mt-1 font-mono">Your files, safely kept.</p>
        </div>
        <div className="deposit-card bg-surface px-7 py-8">{children}</div>
      </div>
    </div>
  );
}
