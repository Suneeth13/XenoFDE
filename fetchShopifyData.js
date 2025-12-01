import dotenv from 'dotenv'
dotenv.config()

import fs from 'fs/promises'
import fetch from 'node-fetch'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN

async function fetchCustomers() {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/customers.json`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  console.log('Customers response status:', res.status)
  const text = await res.text()
  console.log('Customers response text:', text)
  if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`)
  return JSON.parse(text).customers
}

async function fetchProducts() {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/products.json`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  console.log('Products response status:', res.status)
  const text = await res.text()
  console.log('Products response text:', text)
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)
  return JSON.parse(text).products
}

async function fetchOrders() {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/orders.json`, {
    headers: {
      'X-Shopify-Access-Token': ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  console.log('Orders response status:', res.status)
  const text = await res.text()
  console.log('Orders response text:', text)
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`)
  return JSON.parse(text).orders
}



async function main() {
  const customers = await fetchCustomers()
  console.log('Fetched customers:', customers)

  const products = await fetchProducts()
  console.log('Fetched products:', products)

  const orders = await fetchOrders()
  console.log('Fetched orders:', orders)

  await fs.writeFile('customers.json', JSON.stringify(customers, null, 2))
  await fs.writeFile('products.json', JSON.stringify(products, null, 2))
  await fs.writeFile('orders.json', JSON.stringify(orders, null, 2))

  console.log('Data saved to customers.json, products.json, and orders.json')
}


main().catch(console.error)