import { Product } from "../types/Product";

type Props = {
    product: Product;
    onClick?: (product: Product) => void;
};

const currencyFormat = (value: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);

export default function ProductCard({ product, onClick }: Props) {
    return (
        <div
            className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onClick?.(product)}
        >
            {product.image_url ? (
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                    Нет изображения
                </div>
            )}

            <div className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-white line-clamp-2">{product.name}</h3>
                    <span className="text-sm font-semibold text-white shrink-0">
                        {currencyFormat(product.price)}
                    </span>
                </div>
                {product.category_id && (
                    <div className="text-xs text-white">{product.category_id}</div>
                )}
                {product.description && (
                    <p className="text-xs text-white line-clamp-2">{product.description}</p>
                )}
            </div>
        </div>
    );
}




