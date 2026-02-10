/**
 * App Component
 * Main application component that initializes VK Bridge, manages routing, and renders panels
 */

import { useState, useEffect } from 'react';
import {
  ConfigProvider,
  AdaptivityProvider,
  AppRoot,
  SplitLayout,
  SplitCol,
  View,
  Panel,
  PanelHeader,
  Placeholder,
  Spinner,
  Button,
} from '@vkontakte/vkui';
import { Icon56ErrorOutline } from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';

import { vkBridgeService } from './services/vkBridge';
import { CatalogPanel } from './panels/CatalogPanel';
import { CartPanel } from './panels/CartPanel';
import { OrderPanel } from './panels/OrderPanel';
import { extractErrorInfo } from './utils/errorHandling';
import type { LaunchParams } from './types/vkBridge';
import type { Product } from './types/product';
import type { CartItem } from './types/cart';
import { loadCart, saveCart } from './services/storage';

// Panel IDs
const PANEL_CATALOG = 'catalog';
const PANEL_CART = 'cart';
const PANEL_ORDER = 'order';

function App() {
  // Global state
  const [activePanel, setActivePanel] = useState<string>(PANEL_CATALOG);
  const [launchParams, setLaunchParams] = useState<LaunchParams | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize VK Bridge on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Initialize VK Bridge
        await vkBridgeService.init();

        // Get Launch Params
        const params = vkBridgeService.getLaunchParams();
        setLaunchParams(params);

        // Get user info
        await vkBridgeService.getUserInfo();
        // User info retrieved successfully (stored in VK Bridge service if needed)

        // Load cart from local storage
        const savedCart = loadCart();
        setCartItems(savedCart);

        setIsInitializing(false);
      } catch (error) {
        console.error('App initialization failed:', error);
        const errorInfo = extractErrorInfo(error);
        setInitError(errorInfo.message);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      // Check if product already in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id
      );

      let updatedItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Increase quantity if product already in cart
        updatedItems = prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new product to cart
        updatedItems = [...prevItems, { product, quantity: 1 }];
      }

      // Save to local storage
      saveCart(updatedItems);
      return updatedItems;
    });
  };

  // Handle cart change
  const handleCartChange = (items: CartItem[]) => {
    setCartItems(items);
    saveCart(items);
  };

  // Handle cart clear
  const handleCartClear = () => {
    setCartItems([]);
    saveCart([]);
  };

  // Navigation handlers
  const goToCatalog = () => setActivePanel(PANEL_CATALOG);
  const goToCart = () => setActivePanel(PANEL_CART);
  const goToOrder = () => setActivePanel(PANEL_ORDER);

  // Handle retry initialization
  const handleRetryInit = () => {
    window.location.reload();
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <ConfigProvider>
        <AdaptivityProvider>
          <AppRoot>
            <SplitLayout>
              <SplitCol>
                <View activePanel="loading">
                  <Panel id="loading">
                    <PanelHeader>Загрузка</PanelHeader>
                    <Placeholder>
                      <Spinner size="l" />
                    </Placeholder>
                  </Panel>
                </View>
              </SplitCol>
            </SplitLayout>
          </AppRoot>
        </AdaptivityProvider>
      </ConfigProvider>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <ConfigProvider>
        <AdaptivityProvider>
          <AppRoot>
            <SplitLayout>
              <SplitCol>
                <View activePanel="error">
                  <Panel id="error">
                    <PanelHeader>Ошибка</PanelHeader>
                    <Placeholder
                      icon={<Icon56ErrorOutline />}
                      action={
                        <Button size="m" onClick={handleRetryInit}>
                          Перезагрузить
                        </Button>
                      }
                    >
                      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                        Ошибка инициализации
                      </div>
                      {initError}
                    </Placeholder>
                  </Panel>
                </View>
              </SplitCol>
            </SplitLayout>
          </AppRoot>
        </AdaptivityProvider>
      </ConfigProvider>
    );
  }

  // Main app view
  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot>
          <SplitLayout>
            <SplitCol>
              <View activePanel={activePanel}>
                <CatalogPanel
                  id={PANEL_CATALOG}
                  onAddToCart={handleAddToCart}
                  onGoToCart={goToCart}
                  cartItemCount={cartItems.length}
                />
                <CartPanel
                  id={PANEL_CART}
                  onBack={goToCatalog}
                  onCheckout={goToOrder}
                  cartItems={cartItems}
                  onCartChange={handleCartChange}
                />
                <OrderPanel
                  id={PANEL_ORDER}
                  onBack={goToCart}
                  onSuccess={goToCatalog}
                  cartItems={cartItems}
                  launchParams={launchParams || {
                    vk_user_id: 0,
                    vk_app_id: 0,
                    vk_is_app_user: 0,
                    vk_are_notifications_enabled: 0,
                    vk_language: 'ru',
                    vk_platform: 'mobile_web',
                    vk_ts: 0,
                    sign: '',
                  }}
                  onCartClear={handleCartClear}
                />
              </View>
            </SplitCol>
          </SplitLayout>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}

export default App;
