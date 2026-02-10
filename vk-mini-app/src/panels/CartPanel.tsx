/**
 * CartPanel
 * Panel for managing shopping cart items
 */

import { useState, useEffect, useMemo } from 'react';
import { Panel, PanelHeader, PanelHeaderBack } from '@vkontakte/vkui';
import { CartList } from '../components/Cart/CartList';
import { CartSummary } from '../components/Cart/CartSummary';
import { loadCart, saveCart } from '../services/storage';
import type { CartItem } from '../types/cart';

interface CartPanelProps {
  id: string;
  onBack: () => void;
  onCheckout: () => void;
  cartItems?: CartItem[];
  onCartChange?: (items: CartItem[]) => void;
}

export const CartPanel = ({
  id,
  onBack,
  onCheckout,
  cartItems: externalCartItems,
  onCartChange,
}: CartPanelProps) => {
  // Use external cart items if provided, otherwise load from storage
  const [internalCartItems, setInternalCartItems] = useState<CartItem[]>([]);

  const cartItems = externalCartItems !== undefined ? externalCartItems : internalCartItems;
  const setCartItems = onCartChange || setInternalCartItems;

  // Load cart from local storage on mount (only if not using external cart)
  useEffect(() => {
    if (externalCartItems === undefined) {
      const loadedCart = loadCart();
      setInternalCartItems(loadedCart);
    }
  }, [externalCartItems]);

  // Save cart to local storage whenever it changes (only if not using external cart)
  useEffect(() => {
    if (externalCartItems === undefined) {
      saveCart(internalCartItems);
    }
  }, [internalCartItems, externalCartItems]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cartItems]);

  // Handle increase quantity
  const handleIncreaseQuantity = (productId: string) => {
    const updatedItems = cartItems.map((item) =>
      item.product.id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    setCartItems(updatedItems);
  };

  // Handle decrease quantity
  const handleDecreaseQuantity = (productId: string) => {
    const updatedItems = cartItems
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      )
      .filter((item) => item.quantity > 0); // Remove items with 0 quantity
    setCartItems(updatedItems);
  };

  // Handle remove item
  const handleRemove = (productId: string) => {
    const updatedItems = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(updatedItems);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length > 0) {
      onCheckout();
    }
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={onBack} />}>
        Корзина
      </PanelHeader>

      <CartList
        items={cartItems}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onRemove={handleRemove}
      />

      {cartItems.length > 0 && (
        <CartSummary
          totalPrice={totalPrice}
          onCheckout={handleCheckout}
          disabled={cartItems.length === 0}
        />
      )}
    </Panel>
  );
};
