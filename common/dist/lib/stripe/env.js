export function getStripeEnv() {
    const env = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV : undefined;
    if (env === 'production')
        return 'staging';
    if (env === 'staging')
        return 'staging';
    return 'dev';
}
