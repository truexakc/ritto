/**
 * CatalogPanel
 * Main panel for browsing product catalog with search and filter
 */

import { useState, useEffect, useMemo } from 'react';
import { Panel, PanelHeader, PanelHeaderButton, Group, Spinner, Placeholder, Snackbar, Button } from '@vkontakte/vkui';
import { Icon56ErrorOutline, Icon28ShoppingCartOutline, Icon28ErrorCircleOutline } from '@vkontakte/icons';
import { SearchBar } from '../components/Catalog/SearchBar';
import { ProductList } from '../components/Catalog/ProductList';
import { apiService } from '../services/api';
import { extractErrorInfo } from '../utils/errorHandling';
import type { Product } from '../types/product';

interface CatalogPanelProps {
  id: string;
  onAddToCart: (product: Product) => void;
  onGoToCart?: () => void;
  cartItemCount?: number;
}

export const CatalogPanel = ({ id, onAddToCart, onGoToCart, cartItemCount = 0 }: CatalogPanelProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);

  // Fetch catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        setError(null);
        const catalog = await apiService.getCatalog();
        setProducts(catalog);
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
        const errorInfo = extractErrorInfo(err);
        setError(errorInfo.message);
        
        // Show error snackbar for network failures
        if (errorInfo.isRecoverable) {
          setSnackbar(
            <Snackbar
              onClose={() => setSnackbar(null)}
              before={<Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />}
              duration={4000}
            >
              {errorInfo.message}
            </Snackbar>
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map((p) => p.category));
    return Array.from(uniqueCategories).sort();
  }, [products]);

  // Filter products based on search query and selected category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  // Retry handler
  const handleRetry = async () => {
    try {
      setError(null);
      setLoading(true);
      const catalog = await apiService.getCatalog();
      setProducts(catalog);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      const errorInfo = extractErrorInfo(err);
      setError(errorInfo.message);
      setLoading(false);
      
      // Show error snackbar
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={<Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />}
          duration={4000}
        >
          {errorInfo.message}
        </Snackbar>
      );
    }
  };

  return (
    <Panel id={id}>
      <PanelHeader
        after={
          onGoToCart && (
            <PanelHeaderButton onClick={onGoToCart} aria-label="Корзина">
              <Icon28ShoppingCartOutline />
              {cartItemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'var(--vkui--color_background_accent)',
                    color: 'var(--vkui--color_text_contrast)',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </PanelHeaderButton>
          )
        }
      >
        Каталог
      </PanelHeader>

      {loading && (
        <Group>
          <Placeholder>
            <Spinner size="m" />
          </Placeholder>
        </Group>
      )}

      {error && !loading && (
        <Group>
          <Placeholder
            icon={<Icon56ErrorOutline />}
            action={
              <Button size="m" onClick={handleRetry}>
                Повторить
              </Button>
            }
          >
            {error}
          </Placeholder>
        </Group>
      )}

      {!loading && !error && (
        <>
          <SearchBar
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
          />

          <ProductList products={filteredProducts} onAddToCart={onAddToCart} />
        </>
      )}

      {snackbar}
    </Panel>
  );
};
