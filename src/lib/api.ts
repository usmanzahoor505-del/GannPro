const API = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const rawText = await res.text();
  let data: any = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText.slice(0, 500) || `Request failed (${res.status})` };
    }
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }

  return data as T;
}

export const api = {
  health: () => request<{ status: string; database: string }>("/health"),

  register: (body: { name: string; email: string; password: string }) =>
    request<{ message: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyOtp: (body: { email: string; otp: string }) =>
    request<{ user: User }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  resendOtp: (email: string) =>
    request<{ message: string; cooldown: number }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  adminLogin: (body: { email: string; password: string }) =>
    request<{ user: User }>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () => request("/auth/logout", { method: "POST" }),

  me: () => request<{ user: User }>("/auth/me"),

  getPlans: () => request<{ plans: Plan[] }>("/subscription/plans"),

  getSubscriptionStatus: () => request<SubscriptionStatus>("/subscription/status"),

  getNotifications: () =>
    request<{ notifications: Notification[]; unreadCount: number }>("/notifications"),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllNotificationsRead: () =>
    request("/notifications/read-all", { method: "PATCH" }),

  getPaymentHistory: () => request<{ payments: Payment[] }>("/payments/history"),

  submitPayment: (formData: FormData) =>
    request<{ payment: Payment; message: string }>("/payments/submit", {
      method: "POST",
      body: formData,
    }),

  initiateJazzCashPayment: (plan: string) =>
    request<{ url: string; payload: Record<string, string> }>("/payments/jazzcash/initiate", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }),

  submitContactForm: (body: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    request<{ success: boolean; message: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  payWithDirectWallet: (plan: string, mobileNumber: string) =>
    request<{ success: boolean; message: string; payment: any }>("/payments/jazzcash/direct-wallet", {
      method: "POST",
      body: JSON.stringify({ plan, mobileNumber }),
    }),

  payWithDirectCard: (
    plan: string,
    cardDetails: {
      cardNumber: string;
      cardExpiry: string;
      cardCvv: string;
      cardHolder: string;
    }
  ) =>
    request<{ success: boolean; message: string; payment: any }>("/payments/jazzcash/direct-card", {
      method: "POST",
      body: JSON.stringify({ plan, ...cardDetails }),
    }),

  getReceipt: (receiptNo: string) =>
    request<{ receipt: Receipt }>(`/payments/receipt/${receiptNo}`),

  adminStats: () => request<{ stats: AdminStats }>("/admin/stats"),

  adminUsers: () => request<{ users: AdminUser[] }>("/admin/users"),

  adminDeactivateUser: (id: string) =>
    request(`/admin/users/${id}/deactivate`, { method: "PATCH" }),

  adminExtendUser: (id: string, months: number) =>
    request(`/admin/users/${id}/extend`, {
      method: "PATCH",
      body: JSON.stringify({ months }),
    }),

  adminNotifyUser: (id: string, message: string, type?: string) =>
    request(`/admin/users/${id}/notify`, {
      method: "POST",
      body: JSON.stringify({ message, type }),
    }),

  adminPayments: (status = "pending") =>
    request<{ payments: AdminPayment[] }>(`/admin/payments?status=${status}`),

  adminApprovePayment: (id: string) =>
    request(`/admin/payments/${id}/approve`, { method: "POST" }),

  adminRejectPayment: (id: string) =>
    request(`/admin/payments/${id}/reject`, { method: "POST" }),
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  is_active?: boolean;
  created_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  usd: number;
  pkr: number;
  months: number;
  label: string;
}

export interface SubscriptionStatus {
  status: string;
  plan: string | null;
  planName: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  subStart: string | null;
  subEnd: string | null;
  daysRemaining: number;
  hoursRemaining: number;
  hasAccess: boolean;
  message: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  plan_selected: string;
  amount_pkr: number;
  transaction_id: string;
  screenshot_url: string;
  status: string;
  receipt_id: string | null;
  submitted_at: string;
  receipts?: Receipt[];
}

export interface Receipt {
  id: string;
  receipt_no: string;
  user_name: string;
  user_email: string;
  plan: string;
  amount_pkr: number;
  valid_from: string;
  valid_until: string;
  status: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_subscribers: number;
  trial_users: number;
  expired_users: number;
  pending_payments: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  subscription: Record<string, unknown> | null;
}

export interface AdminPayment {
  id: string;
  plan_selected: string;
  amount_pkr: number;
  transaction_id: string;
  screenshot_url: string;
  status: string;
  submitted_at: string;
  users: { name: string; email: string };
}
