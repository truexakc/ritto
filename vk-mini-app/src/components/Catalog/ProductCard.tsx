/**
 * ProductCard Component
 * Displays a single product with image, name, description, price, and add-to-cart button
 */

import { Card, Title, Text, Button, Div } from '@vkontakte/vkui';
import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const handleAddToCart = () => {
    onAddToCart(product);
  };

  return (
    <Card mode="shadow">
      <Div>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '12px'
            }}
          />
        )}
        
        <Title level="3" weight="2" style={{ marginBottom: '8px' }}>
          {product.name}
        </Title>
        
        <Text weight="3" style={{ marginBottom: '12px', color: 'var(--vkui--color_text_primary)' }}>
          {product.price} ₽
        </Text>
        
        <Text style={{ marginBottom: '16px', color: 'var(--vkui--color_text_secondary)' }}>
          {product.description}
        </Text>
        
        <Button
          size="m"
          stretched
          onClick={handleAddToCart}
          disabled={!product.available}
        >
          {product.available ? 'Добавить в корзину' : 'Недоступно'}
        </Button>
      </Div>
    </Card>
  );
};
