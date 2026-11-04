export function isDemoCheckoutEnabled() {
  const configured = process.env.ENABLE_DEMO_CHECKOUT;
  return configured ? configured === 'true' : process.env.NODE_ENV === 'development';
}
