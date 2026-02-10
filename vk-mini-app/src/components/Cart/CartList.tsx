/**
 * CartList Component
 * Displays all cart items or empty state
 */

import { Group, List, Placeholder } from '@vkontakte/vkui';
import { Icon28ShoppingCartOutline } from '@vkontakte/icons';
import { CartItem } from './CartItem';
import type { CartItem as CartItemType } from '../../types/cart';

interface CartListProps {
  items: CartItemType[];
  onIncreaseQuantity: (productId: string) => void;
  onDecreaseQuantity: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export const CartList = ({
  items,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemove
}: CartListProps) => {
  if (items.length === 0) {
    return (
      <Group>
        <Placeholder
          icon={<Icon28ShoppingCartOutline width={56} height={56} />}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Корзина пуста</div>
            <div>Добавьте товары из каталога</div>
          </div>
        </Placeholder>
      </Group>
    );
  }

  return (
    <Group>
      <List>
        {items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onIncreaseQuantity={onIncreaseQuantity}
            onDecreaseQuantity={onDecreaseQuantity}
            onRemove={onRemove}
          />
        ))}
      </List>
    </Group>
  );
};
