import { Timestamp } from '../firebase';

// Firestore Timestamps -> ISO strings, recursively (res.json would otherwise emit {_seconds,_nanoseconds}).
export const toJson = (v: any): any => {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(toJson);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toJson(x)]));
  return v;
};

// Matches the client `Order` type: riderLocation.updatedAt is epoch millis (same as /tracking).
export const serializeOrder = (d: FirebaseFirestore.DocumentSnapshot) => {
  const data = d.data() ?? {};
  const { riderLocation, ...rest } = data;
  return {
    id: d.id,
    ...toJson(rest),
    riderLocation: riderLocation
      ? { ...toJson({ ...riderLocation, updatedAt: null }), updatedAt: riderLocation.updatedAt?.toMillis?.() ?? null }
      : null,
  };
};
