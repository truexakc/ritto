/**
 * OrderForm Component
 * Form for collecting order information: phone, delivery method, address, comment
 */

import { useState } from 'react';
import { Group, FormItem, Input, Textarea, Button } from '@vkontakte/vkui';
import { DeliveryMethodSelector } from './DeliveryMethodSelector';
import type { OrderData } from '../../types/order';

interface OrderFormProps {
  onSubmit: (orderData: Omit<OrderData, 'request_id' | 'items' | 'frontend_total'>) => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  phone?: string;
  delivery_address?: string;
}

export const OrderForm = ({ onSubmit, isSubmitting = false }: OrderFormProps) => {
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Phone is always required
    if (!phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    }

    // Delivery address is required only when delivery method is "delivery"
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      newErrors.delivery_address = 'Адрес доставки обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const orderData = {
      phone: phone.trim(),
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
      comment: comment.trim() || undefined
    };

    onSubmit(orderData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group>
        <FormItem
          top="Телефон"
          status={errors.phone ? 'error' : 'default'}
          bottom={errors.phone}
        >
          <Input
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </FormItem>

        <DeliveryMethodSelector
          value={deliveryMethod}
          onChange={setDeliveryMethod}
        />

        {deliveryMethod === 'delivery' && (
          <FormItem
            top="Адрес доставки"
            status={errors.delivery_address ? 'error' : 'default'}
            bottom={errors.delivery_address}
          >
            <Input
              type="text"
              placeholder="Улица, дом, квартира"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
          </FormItem>
        )}

        <FormItem top="Комментарий к заказу">
          <Textarea
            placeholder="Дополнительная информация (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </FormItem>

        <FormItem>
          <Button
            type="submit"
            size="l"
            stretched
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
          </Button>
        </FormItem>
      </Group>
    </form>
  );
};
