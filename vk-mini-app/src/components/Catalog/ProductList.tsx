/**
 * ProductList Component
 * Displays a list of products in a scrollable grid layout
 */

import { Group, CardGrid, Placeholder } from '@vkontakte/vkui';
import { Icon56GhostOutline } from '@vkontakte/icons';
import { ProductCard } from './ProductCard';
import type { Product } from '../../types/product';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const ProductList = ({ products, onAddToCart }: ProductListProps) => {
  if (products.length === 0) {
    return (
      <Group>
        <Placeholder icon={<Icon56GhostOutline />}>
          Товары не найдены. Попробуйте изменить параметры поиска или фильтры
        </Placeholder>
      </Group>
    );
  }

  return (
    <Group>
      <CardGrid size="l">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </CardGrid>
    </Group>
  );
};
