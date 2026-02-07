import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
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
      return;
    }
    
    setShowProducts(false);
    setSelectedHierarchicalId(hierarchicalId);
    setCurrentPage(1);
    
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

  return (
      <section className="pt-10 lg:pt-28">
        <div className="container">
          <h2 className="text-[#b12e2e] font-bold mt-16 pb-2 lg:pl-3 lg:text-5xl text-4xl mb-6">
            КАТАЛОГ
          </h2>

          {/* Поиск */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl mx-auto">
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

          {/* Категории */}
          <ul className="flex mt-4 gap-2 sm:gap-3 md:gap-4 flex-wrap justify-start md:justify-center">
            <li>
              <button
                  onClick={() => handleCategoryChange(undefined)}
                  className={`text-sm md:text-base border px-3 md:px-4 py-2 flex justify-center items-center cursor-pointer transition-all duration-200 rounded-full whitespace-nowrap ${
                      !selectedHierarchicalId
                          ? "bg-[#f6eaea] text-black font-bold border-[#f6eaea]"
                          : "text-[#f6eaea] border-[#f6eaea]/30 hover:bg-[#f6eaea] hover:text-black hover:border-[#f6eaea]"
                  }`}
              >
                Все
              </button>
            </li>
            {uniqueCategories.map((cat) => (
                <li key={cat.hierarchical_id || cat.id}>
                  <button
                      onClick={() => handleCategoryChange(cat.hierarchical_id)}
                      className={`text-sm md:text-base border px-3 md:px-4 py-2 flex justify-center items-center cursor-pointer transition-all duration-200 rounded-full whitespace-nowrap ${
                          selectedHierarchicalId === cat.hierarchical_id
                              ? "bg-[#f6eaea] text-black font-bold border-[#f6eaea]"
                              : "text-[#f6eaea] border-[#f6eaea]/30 hover:bg-[#f6eaea] hover:text-black hover:border-[#f6eaea]"
                      }`}
                  >
                    {cat.name}
                  </button>
                </li>
            ))}
          </ul>

          {/* Результаты поиска */}
          {searchQuery && (
            <div className="mt-4 text-center text-[#f6eaea]/70">
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
