// Storage keys
const CONFIG_KEY = 'pcstore_config'
const PRODUCTS_KEY = 'pcstore_products'

// Default configuration
const defaultConfig = {
    storeName: 'PC Store',
    storeEmail: '',
    currency: '$',
    taxRate: 18,
    categories: ['Desktop', 'Laptop', 'Components', 'Peripherals']
}

// ===== Config Functions =====
function loadConfig() {
    try {
        const stored = localStorage.getItem(CONFIG_KEY)
        return stored ? JSON.parse(stored) : { ...defaultConfig }
    } catch (e) {
        return { ...defaultConfig }
    }
}

function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

// ===== Product Functions =====
function loadProducts() {
    try {
        const stored = localStorage.getItem(PRODUCTS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (e) {
        return []
    }
}

function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
}

// ===== Utility Functions =====
function formatMoney(amount, currency) {
    const num = Number(amount).toFixed(2)
    return `${currency}${num}`
}

function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

// ===== UI Update Functions =====
function updateConfigDisplay(config) {
    document.getElementById('displayStoreName').textContent = config.storeName || 'PC Store'
    document.getElementById('displayStoreEmail').textContent = config.storeEmail || '-'
    document.getElementById('displayCurrency').textContent = config.currency || '$'
    document.getElementById('displayTaxRate').textContent = `${config.taxRate || 0}%`
    document.getElementById('displayCategories').textContent = (config.categories || []).join(', ') || 'None'
    document.title = `${config.storeName} - PC Store`
}

function populateCategorySelect(categories) {
    const select = document.getElementById('productCategory')
    select.innerHTML = ''
    const cats = categories && categories.length ? categories : ['General']
    cats.forEach(cat => {
        const option = document.createElement('option')
        option.value = cat
        option.textContent = cat
        select.appendChild(option)
    })
}

function updateStatistics() {
    const products = loadProducts()
    const config = loadConfig()
    
    const totalProducts = products.length
    const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
    const totalValue = products.reduce((sum, p) => {
        const price = Number(p.price) || 0
        const stock = Number(p.stock) || 0
        const priceWithTax = price * (1 + (config.taxRate || 0) / 100)
        return sum + (priceWithTax * stock)
    }, 0)

    document.getElementById('totalProducts').textContent = totalProducts
    document.getElementById('totalStock').textContent = totalStock
    document.getElementById('totalValue').textContent = formatMoney(totalValue, config.currency)
}

function renderProducts() {
    const tbody = document.querySelector('#productsTable tbody')
    const products = loadProducts()
    const config = loadConfig()

    if (products.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No products added yet. Add one to get started!</td></tr>'
        updateStatistics()
        return
    }

    tbody.innerHTML = products.map((product, index) => {
        const price = Number(product.price) || 0
        const stock = Number(product.stock) || 0
        const priceWithTax = price * (1 + (config.taxRate || 0) / 100)
        const value = priceWithTax * stock

        return `
            <tr>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.sku || '-')}</td>
                <td>${escapeHtml(product.category)}</td>
                <td>${formatMoney(price, config.currency)}</td>
                <td>${formatMoney(priceWithTax, config.currency)}</td>
                <td>${stock}</td>
                <td>${formatMoney(value, config.currency)}</td>
                <td><button class="btn-delete" data-index="${index}">Delete</button></td>
            </tr>
        `
    }).join('')

    updateStatistics()
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    const config = loadConfig()

    // Load config into form
    document.getElementById('storeName').value = config.storeName || ''
    document.getElementById('storeEmail').value = config.storeEmail || ''
    document.getElementById('currency').value = config.currency || '$'
    document.getElementById('taxRate').value = config.taxRate || 18
    document.getElementById('categories').value = (config.categories || []).join('\n')

    // Update displays
    updateConfigDisplay(config)
    populateCategorySelect(config.categories || [])
    renderProducts()

    // Save configuration
    document.getElementById('saveConfig').addEventListener('click', (e) => {
        e.preventDefault()
        const newConfig = {
            storeName: document.getElementById('storeName').value || 'PC Store',
            storeEmail: document.getElementById('storeEmail').value || '',
            currency: document.getElementById('currency').value || '$',
            taxRate: Number(document.getElementById('taxRate').value) || 0,
            categories: document.getElementById('categories').value
                .split('\n')
                .map(cat => cat.trim())
                .filter(cat => cat.length > 0)
        }

        if (newConfig.categories.length === 0) {
            newConfig.categories = ['General']
        }

        saveConfig(newConfig)
        updateConfigDisplay(newConfig)
        populateCategorySelect(newConfig.categories)
        renderProducts()
        alert('✓ Configuration saved successfully!')
    })

    // Reset configuration
    document.getElementById('resetConfig').addEventListener('click', () => {
        if (!confirm('Reset all settings to default? This cannot be undone.')) return

        saveConfig(defaultConfig)
        document.getElementById('storeName').value = defaultConfig.storeName
        document.getElementById('storeEmail').value = defaultConfig.storeEmail
        document.getElementById('currency').value = defaultConfig.currency
        document.getElementById('taxRate').value = defaultConfig.taxRate
        document.getElementById('categories').value = defaultConfig.categories.join('\n')

        updateConfigDisplay(defaultConfig)
        populateCategorySelect(defaultConfig.categories)
        renderProducts()
        alert('✓ Configuration reset to defaults!')
    })

    // Add product
    document.getElementById('addProductForm').addEventListener('submit', (e) => {
        e.preventDefault()

        const name = document.getElementById('productName').value.trim()
        const category = document.getElementById('productCategory').value
        const sku = document.getElementById('productSKU').value.trim()
        const price = Number(document.getElementById('productPrice').value)
        const stock = Number(document.getElementById('productStock').value) || 1

        if (!name) {
            alert('Please enter a product name')
            return
        }

        if (isNaN(price) || price < 0) {
            alert('Please enter a valid price')
            return
        }

        const products = loadProducts()
        products.push({ name, category, sku, price, stock })
        saveProducts(products)

        // Reset form
        e.target.reset()
        document.getElementById('productStock').value = 1

        renderProducts()
        alert('✓ Product added successfully!')
    })

    // Clear all products
    document.getElementById('clearProducts').addEventListener('click', () => {
        if (!confirm('Delete all products? This cannot be undone.')) return

        saveProducts([])
        renderProducts()
        alert('✓ All products cleared!')
    })

    // Delete single product
    document.querySelector('#productsTable tbody').addEventListener('click', (e) => {
        if (e.target.matches('.btn-delete')) {
            const index = Number(e.target.dataset.index)
            if (isNaN(index)) return

            const products = loadProducts()
            products.splice(index, 1)
            saveProducts(products)
            renderProducts()
        }
    })

    // Smooth scroll navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            const target = link.getAttribute('href')
            const element = document.querySelector(target)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
                
                // Update active link
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'))
                link.classList.add('active')
            }
        })
    })
})
