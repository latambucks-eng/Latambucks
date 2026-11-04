import { useLocation } from 'react-router-dom';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="lb-stage relative min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-orange-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-[100px]" />
            <div className="relative z-10 max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-muted-foreground/30">404</h1>
                        <div className="h-0.5 w-16 bg-border mx-auto"></div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-foreground">
                            Página no encontrada
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            La página <span className="font-medium text-foreground">"{pageName}"</span> no existe en esta aplicación.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-950 bg-orange-500 rounded-xl hover:bg-orange-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}