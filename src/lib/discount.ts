export function computeDiscount(args: {
  subtotal: number;
  coupon: { type: "percent" | "fixed"; value: number; min_order: number; max_discount: number | null };
}) {
  const { subtotal, coupon } = args;
  if (subtotal < coupon.min_order) return 0;

  let d = 0;
  if (coupon.type === "fixed") d = coupon.value;
  else d = Math.floor((subtotal * coupon.value) / 100);

  if (coupon.type === "percent" && coupon.max_discount != null) {
    d = Math.min(d, coupon.max_discount);
  }
  d = Math.max(0, Math.min(d, subtotal));
  return d;
}
