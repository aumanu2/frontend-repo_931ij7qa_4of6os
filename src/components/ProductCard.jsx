import React from 'react'

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col">
      {product.image && (
        <img src={product.image} alt={product.title} className="h-48 w-full object-cover" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-bold">${Number(product.price).toFixed(2)}</span>
          <button
            onClick={() => onAdd(product)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded"
            disabled={!product.in_stock || product.stock_qty <= 0}
          >
            {product.in_stock ? 'Add to Cart' : 'Out of stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
