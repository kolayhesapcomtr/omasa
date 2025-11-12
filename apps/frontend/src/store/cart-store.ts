import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  notes?: string;
  variantId?: string;
  variantName?: string;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  qrCode: string | null;
  setTable: (tableId: string, qrCode: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  updateNotes: (productId: string, notes: string, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      qrCode: null,

      setTable: (tableId, qrCode) => set({ tableId, qrCode }),

      addItem: (item) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          );

          if (existingItemIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += 1;
            return { items: newItems };
          }

          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId),
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item,
          ),
        })),

      updateNotes: (productId, notes, variantId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, notes }
              : item,
          ),
        })),

      clearCart: () => set({ items: [], tableId: null, qrCode: null }),

      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'omasa-cart-storage',
    },
  ),
);
