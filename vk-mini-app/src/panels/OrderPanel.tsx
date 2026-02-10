/**
 * OrderPanel
 * Panel for order checkout and submission
 */

import { useState } from 'react';
import { Panel, PanelHeader, PanelHeaderBack, Snackbar, Alert } from '@vkontakte/vkui';
import { Icon28CheckCircleOutline, Icon28ErrorCircleOutline } from '@vkontakte/icons';
import { OrderForm } from '../components/Order/OrderForm';
import { apiService } from '../services/api';
import { clearCart } from '../services/storage';
import { extractErrorInfo, isAuthError, isRateLimitError } from '../utils/errorHandling';
import type { CartItem } from '../types/cart';
import type { OrderData } from '../types/order';
import type { LaunchParams } from '../types/vkBridge';

interface OrderPanelProps {
  id: string;
  onBack: () => void;
  onSuccess: () => void;
  cartItems: CartItem[];
  launchParams: LaunchParams;
  onCartClear?: () => void;
}

export const OrderPanel = ({
  id,
  onBack,
  onSuccess,
  cartItems,
  launchParams,
  onCartClear,
}: OrderPanelProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);
  const [alert, setAlert] = useState<React.ReactNode | null>(null);

  // Calculate total price
  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  // Handle order submission
  const handleSubmit = async (
    formData: Omit<OrderData, 'request_id' | 'items' | 'frontend_total'>
  ) => {
    try {
      setIsSubmitting(true);

      // Generate client request ID for idempotency
      const requestId = apiService.generateRequestId();

      // Calculate frontend total
      const frontendTotal = calculateTotal();

      // Prepare order data
      const orderData: OrderData = {
        request_id: requestId,
        items: cartItems,
        frontend_total: frontendTotal,
        ...formData,
      };

      // Send order to Backend API with Launch Params
      const response = await apiService.createOrder(orderData, launchParams);

      // Show success message
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={<Icon28CheckCircleOutline fill="var(--vkui--color_icon_positive)" />}
          duration={3000}
        >
          Заказ успешно оформлен! Номер заказа: {response.order_id}
        </Snackbar>
      );

      // Clear cart after successful order
      clearCart();
      if (onCartClear) {
        onCartClear();
      }

      // Navigate back to catalog after short delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Failed to create order:', error);

      // Extract error information
      const errorInfo = extractErrorInfo(error);

      // Show critical errors as alerts
      if (isAuthError(error)) {
        setAlert(
          <Alert
            actions={[
              {
                title: 'Перезагрузить',
                mode: 'default',
              },
            ]}
            onClose={() => {
              setAlert(null);
              window.location.reload();
            }}
          >
            <h2>Ошибка аутентификации</h2>
            <p>{errorInfo.message}</p>
          </Alert>
        );
      } else if (isRateLimitError(error)) {
        setAlert(
          <Alert
            actions={[
              {
                title: 'Понятно',
                mode: 'default',
              },
            ]}
            onClose={() => setAlert(null)}
          >
            <h2>Превышен лимит</h2>
            <p>{errorInfo.message}</p>
          </Alert>
        );
      } else {
        // Show network/server errors as snackbars with retry option
        setSnackbar(
          <Snackbar
            onClose={() => setSnackbar(null)}
            before={<Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />}
            duration={5000}
            action={errorInfo.isRecoverable ? 'Повторить' : undefined}
            onActionClick={errorInfo.isRecoverable ? () => {
              setSnackbar(null);
              handleSubmit(formData);
            } : undefined}
          >
            {errorInfo.message}
          </Snackbar>
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={onBack} />}>
        Оформление заказа
      </PanelHeader>

      <OrderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      {snackbar}
      {alert}
    </Panel>
  );
};
