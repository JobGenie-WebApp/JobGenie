export function ApprovalCelebrationVideo() {
    return (
        <div
            className="pointer-events-none relative flex min-h-[250px] items-center justify-center sm:min-h-[360px]"
            aria-hidden="true"
        >
            <span className="absolute h-52 w-40 rounded-full bg-lime-300/10 blur-3xl sm:h-72 sm:w-52" />
            <video
                src="/gan1.webm"
                autoPlay
                muted
                playsInline
                preload="auto"
                className="relative z-10 h-[300px] w-auto max-w-full bg-transparent object-contain drop-shadow-[0_20px_24px_rgba(2,12,7,0.3)] sm:h-[360px]"
            />
        </div>
    );
}
