/**
 * CartSummary Component
 * Displays total price and checkout button
 */

import { FixedLayout, Button, Div, Title } from '@vkontakte/vkui';

interface CartSummaryProps {
  totalPrice: number;
  onCheckout: () => void;
  disabled?: boolean;
}

export const CartSummary = ({
  totalPrice,
  onCheckout,
  disabled = false
}: CartSummaryProps) => {
  return (
    <FixedLayout vertical="bottom" filled>
      <Div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--vkui--color_background_content)',
        borderTop: '1px solid var(--vkui--color_separator_primary)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Title level="3" weight="2">
            Итого:
          </Title>
          <Title level="2" weight="1">
            {totalPrice} ₽
          </Title>
        </div>
        
        <Button
          size="l"
          stretched
          onClick={onCheckout}
          disabled={disabled}
        >
          Оформить заказ
        </Button>
      </Div>
    </FixedLayout>
  );
};
