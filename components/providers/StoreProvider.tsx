"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ApiError,
  authApi,
  cartApi,
  clearGuestToken,
  getOrCreateGuestToken,
  getStoredSession,
  setStoredSession,
  wishlistApi,
} from "@/lib/api";
import type { AuthSession, Cart, User, WishlistItem } from "@/lib/types";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface StoreContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoadingAuth: boolean;
  cart: Cart | null;
  isCartLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  wishlistItems: WishlistItem[];
  wishlistIds: Set<number>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  }) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshCart: () => Promise<void>;
  addToCart: (
    productId: number,
    variantId?: number | null,
    quantity?: number,
    openDrawer?: boolean
  ) => Promise<boolean>;
  updateCartQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeCartItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: number) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  notify: (toast: Omit<ToastItem, "id">) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const refreshCart = useCallback(async () => {
    setIsCartLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      // Guest cart might not exist yet or network hiccup
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    const session = getStoredSession();
    if (!session?.access) {
      setWishlistItems([]);
      return;
    }
    try {
      const items = await wishlistApi.list();
      setWishlistItems(items);
    } catch {
      setWishlistItems([]);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const session = getStoredSession();
    if (!session?.access) {
      setUser(null);
      return;
    }
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      setStoredSession({ ...session, user: profile });
    } catch {
      setStoredSession(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = getStoredSession();
      if (session?.user) {
        if (active) setUser(session.user);
        try {
          const profile = await authApi.getProfile();
          if (active) {
            setUser(profile);
            setStoredSession({ ...session, user: profile });
          }
        } catch {
          if (active) {
            setStoredSession(null);
            setUser(null);
          }
        }
      } else {
        getOrCreateGuestToken();
      }
      if (active) setIsLoadingAuth(false);
      await refreshCart();
      if (getStoredSession()?.access) {
        await refreshWishlist();
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshCart, refreshWishlist]);

  const mergeGuestCartIfPresent = useCallback(async () => {
    if (typeof window === "undefined") return;
    const guestToken = window.localStorage.getItem("arrow_guest_token_v1");
    if (!guestToken) return;
    try {
      const merged = await cartApi.mergeCart(guestToken);
      setCart(merged);
      clearGuestToken();
    } catch {
      // ignore if guest cart empty
    }
  }, []);

  const finalizeSession = useCallback(
    async (session: AuthSession): Promise<User> => {
      setStoredSession(session);
      setUser(session.user);
      await mergeGuestCartIfPresent();
      await Promise.all([refreshCart(), refreshWishlist()]);
      return session.user;
    },
    [mergeGuestCartIfPresent, refreshCart, refreshWishlist]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const session = await authApi.login(email, password);
      const loggedUser = await finalizeSession(session);
      notify({
        type: "success",
        title: `Welcome back, ${loggedUser.first_name || loggedUser.email}`,
      });
      return loggedUser;
    },
    [finalizeSession, notify]
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      password_confirm: string;
      first_name: string;
      last_name: string;
      phone_number: string;
    }): Promise<User> => {
      const session = await authApi.register(payload);
      const createdUser = await finalizeSession(session);
      notify({
        type: "success",
        title: "Account created",
        message: "Welcome to Arrow Ventures.",
      });
      return createdUser;
    },
    [finalizeSession, notify]
  );

  const logout = useCallback(() => {
    setStoredSession(null);
    setUser(null);
    setWishlistItems([]);
    getOrCreateGuestToken();
    refreshCart();
    notify({ type: "info", title: "Signed out" });
  }, [notify, refreshCart]);

  const addToCart = useCallback(
    async (
      productId: number,
      variantId?: number | null,
      quantity = 1,
      openDrawer = true
    ): Promise<boolean> => {
      try {
        const updated = await cartApi.addItem({
          product_id: productId,
          variant_id: variantId ?? undefined,
          quantity,
        });
        setCart(updated);
        if (openDrawer) {
          setIsCartOpen(true);
        }
        notify({
          type: "success",
          title: "Added to cart",
          message: `${quantity} item${quantity > 1 ? "s" : ""} updated in your bag.`,
        });
        return true;
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Could not add item to cart.";
        notify({ type: "error", title: "Unable to add item", message: msg });
        return false;
      }
    },
    [notify]
  );

  const updateCartQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      try {
        if (quantity <= 0) {
          const updated = await cartApi.removeItem(itemId);
          setCart(updated);
          return;
        }
        const updated = await cartApi.updateItem(itemId, quantity);
        setCart(updated);
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Failed to update quantity.";
        notify({ type: "error", title: "Quantity update failed", message: msg });
      }
    },
    [notify]
  );

  const removeCartItem = useCallback(
    async (itemId: number) => {
      try {
        const updated = await cartApi.removeItem(itemId);
        setCart(updated);
        notify({ type: "info", title: "Item removed from cart" });
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Failed to remove item.";
        notify({ type: "error", title: "Remove failed", message: msg });
      }
    },
    [notify]
  );

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clearCart();
      await refreshCart();
      notify({ type: "info", title: "Cart cleared" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to clear cart.";
      notify({ type: "error", title: "Error", message: msg });
    }
  }, [notify, refreshCart]);

  const wishlistIds = useMemo(
    () => new Set(wishlistItems.map((w) => w.product.id)),
    [wishlistItems]
  );

  const toggleWishlist = useCallback(
    async (productId: number): Promise<boolean> => {
      const session = getStoredSession();
      if (!session?.access) {
        notify({
          type: "info",
          title: "Sign in to save wishlist",
          message: "Create an account or sign in to save your favorite rides.",
        });
        return false;
      }
      try {
        const res = await wishlistApi.toggle(productId);
        await refreshWishlist();
        notify({
          type: "success",
          title: res.added ? "Saved to wishlist" : "Removed from wishlist",
        });
        return res.added;
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "Wishlist update failed.";
        notify({ type: "error", title: "Error", message: msg });
        return false;
      }
    },
    [notify, refreshWishlist]
  );

  const isAdmin = Boolean(
    user && (user.role === "ADMIN" || user.role === "STAFF" || user.is_staff || user.is_superuser)
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin,
      isLoadingAuth,
      cart,
      isCartLoading,
      isCartOpen,
      setIsCartOpen,
      wishlistItems,
      wishlistIds,
      login,
      register,
      logout,
      refreshProfile,
      refreshCart,
      addToCart,
      updateCartQuantity,
      removeCartItem,
      clearCart,
      toggleWishlist,
      refreshWishlist,
      notify,
    }),
    [
      user,
      isAdmin,
      isLoadingAuth,
      cart,
      isCartLoading,
      isCartOpen,
      wishlistItems,
      wishlistIds,
      login,
      register,
      logout,
      refreshProfile,
      refreshCart,
      addToCart,
      updateCartQuantity,
      removeCartItem,
      clearCart,
      toggleWishlist,
      refreshWishlist,
      notify,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      {/* Toast Notifications */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl bg-[#0B0B0D] text-white px-4 py-3 shadow-xl border border-white/10 text-sm"
          >
            {t.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-xs text-neutral-300 mt-0.5 leading-snug">
                  {t.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
              aria-label="Dismiss notification"
              className="text-neutral-400 hover:text-white p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}
