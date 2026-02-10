/**
 * DeliveryMethodSelector Component
 * Radio buttons for selecting delivery or pickup method
 */

import { FormItem, Radio } from '@vkontakte/vkui';

interface DeliveryMethodSelectorProps {
  value: 'delivery' | 'pickup';
  onChange: (value: 'delivery' | 'pickup') => void;
}

export const DeliveryMethodSelector = ({
  value,
  onChange
}: DeliveryMethodSelectorProps) => {
  return (
    <FormItem top="Способ получения">
      <Radio
        name="delivery_method"
        value="delivery"
        checked={value === 'delivery'}
        onChange={(e) => onChange(e.target.value as 'delivery' | 'pickup')}
      >
        Доставка
      </Radio>
      <Radio
        name="delivery_method"
        value="pickup"
        checked={value === 'pickup'}
        onChange={(e) => onChange(e.target.value as 'delivery' | 'pickup')}
      >
        Самовывоз
      </Radio>
    </FormItem>
  );
};
