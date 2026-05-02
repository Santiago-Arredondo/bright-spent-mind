const KEY = "flowbit_device_id";

export const getDeviceId = (): string => {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto as any)?.randomUUID?.() ??
      `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
};

export const getUserAgent = (): string =>
  typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "unknown";
