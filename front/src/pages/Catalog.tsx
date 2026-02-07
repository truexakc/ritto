import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, ChevronDown } from "lucide-react";
import CartItem from "../components/CartItem";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const ITEMS_PER_PAGE = 12;

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHierarchicalId, setSelectedHierarchicalId] = useState<string | undefined>(
    searchParams.get('hierarchical_parent') || undefined
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('search') || ''
  );
  const [searchInput, setSearchInput] = useState<string>(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProducts, setShowProducts] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading, isError } = useProducts({
    hierarchicalParent: selectedHierarchicalId,
    search: searchQuery || undefined,
  });

  // Sync URL with state only on initial load and browser back/forward
  useEffect(() => {
    const urlHierarchical = searchParams.get('hierarchical_parent') || undefined;
    const urlSearch = searchParams.get('search') || '';
    
    if (urlHierarchical !== selectedHierarchicalId) {
      setSelectedHierarchicalId(urlHierarchical);
      setShowProducts(false);
    }
    
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setSearchInput(urlSearch);
      setShowProducts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return (categories ?? []).filter((c) => {
      const key = c.hierarchical_id || c.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  const totalPages = useMemo(() => {
    return Math.ceil((products?.length || 0) / ITEMS_PER_PAGE);
  }, [products]);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products?.slice(startIndex, endIndex) || [];
  }, [products, currentPage]);

  const isLoading = categoriesLoading || productsLoading;

  // Animate products appearance when they change
  useEffect(() => {
    if (!isLoading && currentProducts.length > 0) {
      setShowProducts(false);
      const timer = setTimeout(() => setShowProducts(true), 50);
      return () => clearTimeout(timer);
    } else if (isLoading) {
      setShowProducts(false);
    }
  }, [currentProducts.length, isLoading, selectedHierarchicalId, searchQuery, currentPage]);

  const handleCategoryChange = (hierarchicalId?: string) => {
    // Не делаем ничего, если категория уже выбрана
    if (hierarchicalId === selectedHierarchicalId) {
      setCategoryDropdownOpen(false);
      return;
    }
    
    setShowProducts(false);
    setSelectedHierarchicalId(hierarchicalId);
    setCurrentPage(1);
    setCategoryDropdownOpen(false);
    
    // Update URL params
    const params: Record<string, string> = {};
    if (hierarchicalId) {
      params.hierarchical_parent = hierarchicalId;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchInput.trim();
    
    if (trimmedSearch === searchQuery) {
      return;
    }
    
    setShowProducts(false);
    setSearchQuery(trimmedSearch);
    setCurrentPage(1);
    
    // Update URL params
    const params: Record<string, string> = {};
    if (selectedHierarchicalId) {
      params.hierarchical_parent = selectedHierarchicalId;
    }
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
    
    // Update URL params
    const params: Record<string, string> = {};
    if (selectedHierarchicalId) {
      params.hierarchical_parent = selectedHierarchicalId;
    }
    setSearchParams(params);
  };

  const selectedCategory = useMemo(() => {
    if (!selectedHierarchicalId) return null;
    return uniqueCategories.find(cat => cat.hierarchical_id === selectedHierarchicalId);
  }, [selectedHierarchicalId, uniqueCategories]);

  return (
      <section className="pt-10 lg:pt-28">
        <div className="container">
          <h2 className="text-[#b12e2e] font-bold mt-16 pb-2 lg:pl-3 lg:text-5xl text-4xl mb-6">
            КАТАЛОГ
          </h2>

          {/* Поиск и категории в одну строку */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Выпадающий список категорий */}
            <div className="relative sm:w-64">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#f6eaea]/20 rounded-full text-[#f6eaea] hover:border-[#b12e2e] transition-colors flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedCategory ? selectedCategory.name : 'Все категории'}
                </span>
                <ChevronDown className={`w-5 h-5 text-[#f6eaea]/50 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown menu */}
              {categoryDropdownOpen && (
                <>
                  {/* Backdrop для закрытия при клике вне */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setCategoryDropdownOpen(false)}
                  />
                  
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#f6eaea]/20 rounded-2xl shadow-xl z-20 max-h-96 overflow-y-auto">
                    <button
                      onClick={() => handleCategoryChange(undefined)}
                      className={`w-full px-4 py-3 text-left hover:bg-[#f6eaea]/10 transition-colors first:rounded-t-2xl ${
                        !selectedHierarchicalId ? 'bg-[#b12e2e]/20 text-[#b12e2e] font-semibold' : 'text-[#f6eaea]'
                      }`}
                    >
                      Все категории
                    </button>
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat.hierarchical_id || cat.id}
                        onClick={() => handleCategoryChange(cat.hierarchical_id)}
                        className={`w-full px-4 py-3 text-left hover:bg-[#f6eaea]/10 transition-colors last:rounded-b-2xl ${
                          selectedHierarchicalId === cat.hierarchical_id 
                            ? 'bg-[#b12e2e]/20 text-[#b12e2e] font-semibold' 
                            : 'text-[#f6eaea]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Поле поиска */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Поиск по названию или описанию..."
                  className="w-full px-4 py-3 pl-12 pr-12 bg-[#1a1a1a] border border-[#f6eaea]/20 rounded-full text-[#f6eaea] placeholder-[#f6eaea]/50 focus:outline-none focus:border-[#b12e2e] transition-colors"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#f6eaea]/50" />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#f6eaea]/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-[#f6eaea]/50 hover:text-[#b12e2e]" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Результаты поиска */}
          {searchQuery && (
            <div className="mb-4 text-center text-[#f6eaea]/70">
              Результаты поиска: <span className="text-[#b12e2e] font-semibold">"{searchQuery}"</span>
              {products && products.length > 0 && (
                <span> — найдено {products.length} {products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}</span>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 py-8">
            {isLoading && <p className="text-center col-span-full text-[#f6eaea]">Загрузка...</p>}
            {isError && (
                <p className="text-center col-span-full text-red-500">
                  Ошибка при загрузке товаров
                </p>
            )}
            {!isLoading && !isError && products?.length === 0 && (
                <p className="text-center col-span-full text-[#f6eaea]/70">
                  {searchQuery ? 'По вашему запросу ничего не найдено' : 'Товары не найдены'}
                </p>
            )}
            {!isLoading && currentProducts.map((product, index) => (
                <div
                    key={`${product.id}-${selectedHierarchicalId}-${searchQuery}`}
                    className={`transition-all duration-500 ease-out ${
                        showProducts
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                    }`}
                    style={{
                        transitionDelay: showProducts ? `${index * 50}ms` : '0ms'
                    }}
                >
                    <CartItem product={product} />
                </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pb-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-[#b12e2e] text-[#b12e2e] rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b12e2e] hover:text-black transition-all"
              >
                Назад
              </button>
              
              <span className="text-[#f6eaea] px-4 text-1l">
                {currentPage} из {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-[#b12e2e] text-[#b12e2e] rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b12e2e] hover:text-black transition-all"
              >
                Вперёд
              </button>
            </div>
          )}
        </div>
      </section>
  );
};

export default Catalog;
