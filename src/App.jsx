import { useEffect, useMemo, useState } from 'react'
import ProductCard from './components/ProductCard'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState({ name: '', email: '', address: '' })
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart])
  const shipping = useMemo(() => (subtotal > 100 || subtotal === 0 ? 0 : 8.0), [subtotal])
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${baseUrl}/api/products`)
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      if (!data || data.length === 0) {
        // Seed demo products automatically
        await fetch(`${baseUrl}/api/products/seed`)
        const res2 = await fetch(`${baseUrl}/api/products`)
        const data2 = await res2.json()
        setProducts(data2)
      } else {
        setProducts(data)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id)
      if (exists) {
        return prev.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p))
      }
      return [...prev, { id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id)
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)))
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id))
  }

  const placeOrder = async () => {
    if (!customer.name || !customer.email || !customer.address) return alert('Please fill your details')
    if (cart.length === 0) return alert('Cart is empty')
    try {
      setPlacing(true)
      setOrder(null)
      const payload = {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_address: customer.address,
        items: cart.map((c) => ({ product_id: c.id, title: c.title, price: c.price, quantity: c.quantity, image: c.image })),
        subtotal: Number(subtotal.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(total.toFixed(2)),
        status: 'processing'
      }
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Order failed')
      }
      const data = await res.json()
      setOrder(data)
      setCart([])
    } catch (e) {
      alert(e.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">BlueShop</h1>
          <nav className="text-sm text-gray-600">Simple ecommerce demo</nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Products</h2>
            <button onClick={loadProducts} className="text-sm text-blue-600 hover:underline">Reload</button>
          </div>
          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </section>

        <aside className="bg-white rounded-xl shadow p-4 h-fit sticky top-20">
          <h3 className="font-semibold text-lg">Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">No items yet.</p>
          ) : (
            <div className="divide-y mt-2">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 bg-gray-100 rounded">-</button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQty(item.id, Number(e.target.value))}
                      className="w-14 border rounded px-2 py-1 text-sm"
                      min={1}
                    />
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 bg-gray-100 rounded">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-600 ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <input
              placeholder="Full name"
              className="w-full border rounded px-3 py-2 text-sm"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
            <input
              placeholder="Email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            />
            <textarea
              placeholder="Shipping address"
              className="w-full border rounded px-3 py-2 text-sm"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            />
            <button onClick={placeOrder} disabled={placing || cart.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded disabled:opacity-50">
              {placing ? 'Placing Order...' : 'Checkout'}
            </button>
            {order && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="font-medium">Order placed!</p>
                <p className="text-gray-600">Order ID: {order.id}</p>
                <p className="text-gray-600">Total: ${order.total?.toFixed?.(2) || order.total}</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="text-center text-sm text-gray-500 py-8">© 2025 BlueShop</footer>
    </div>
  )
}

export default App
