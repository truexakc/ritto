/**
 * CartItem Component
 * Displays a single cart item with product info, quantity controls, and remove button
 */

import { Cell, Counter, IconButton } from '@vkontakte/vkui';
import { Icon24Delete } from '@vkontakte/icons';
import type { CartItem as CartItemType } from '../../types/cart';

interface CartItemProps {
  item: CartItemType;
  onIncreaseQuantity: (productId: string) => void;
  onDecreaseQuantity: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export const CartItem = ({
  item,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemove
}: CartItemProps) => {
  const { product, quantity } = item;
  const totalPrice = product.price * quantity;

  return (
    <Cell
      after={
        <IconButton
          onClick={() => onRemove(product.id)}
          aria-label="Удалить товар"
        >
          <Icon24Delete />
        </IconButton>
      }
      subtitle={`${product.price} ₽ × ${quantity} = ${totalPrice} ₽`}
      indicator={
        <Counter
          mode="primary"
          size="m"
        >
          {quantity}
        </Counter>
      }
      before={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <IconButton
            onClick={() => onDecreaseQuantity(product.id)}
            aria-label="Уменьшить количество"
            disabled={quantity <= 1}
          >
            -
          </IconButton>
          <IconButton
            onClick={() => onIncreaseQuantity(product.id)}
            aria-label="Увеличить количество"
          >
            +
          </IconButton>
        </div>
      }
    >
      {product.name}
    </Cell>
  );
};
