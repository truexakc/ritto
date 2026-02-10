/**
 * SearchBar Component
 * Provides search input and category filter for product catalog
 */

import { Group, Search, FormItem, NativeSelect } from '@vkontakte/vkui';
import type { ChangeEvent } from 'react';

interface SearchBarProps {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
}

export const SearchBar = ({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange
}: SearchBarProps) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value);
  };

  return (
    <Group>
      <Search
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Поиск товаров..."
      />
      
      <FormItem top="Категория">
        <NativeSelect
          value={selectedCategory}
          onChange={handleCategoryChange}
          placeholder="Все категории"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </NativeSelect>
      </FormItem>
    </Group>
  );
};
