import express from 'express'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { exec } from 'child_process'
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import cors from 'cors'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const prisma = new PrismaClient()

// Enable CORS
app.use(cors())

// Load JSON data
const customersData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'customers.json'), 'utf8'))
const productsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'products.json'), 'utf8'))
const ordersData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'orders.json'), 'utf8'))

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

function verifyWebhook(req) {
  const hmac = req.get('X-Shopify-Hmac-SHA256')
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  const hash = crypto.createHmac('sha256', secret).update(req.rawBody, 'utf8').digest('base64')
  return hmac === hash
}

app.get('/', (req, res) => {
  res.send('Xeno Shopify Data Ingestion Service is running')
})

// Webhook for cart abandoned
app.post('/webhooks/cart/abandoned', (req, res) => {
  if (!verifyWebhook(req)) {
    console.log('Invalid webhook signature for cart abandoned')
    return res.status(401).send('Unauthorized')
  }
  console.log('Received cart abandoned webhook:', req.body)
  // Handle cart abandoned event (e.g., trigger data sync or custom logic)
  res.status(200).send('OK')
})

// Webhook for checkout started
app.post('/webhooks/checkout/started', (req, res) => {
  if (!verifyWebhook(req)) {
    console.log('Invalid webhook signature for checkout started')
    return res.status(401).send('Unauthorized')
  }
  console.log('Received checkout started webhook:', req.body)
  // Handle checkout started event (e.g., trigger data sync or custom logic)
  res.status(200).send('OK')
})

// API endpoints for dashboard
app.get('/api/metrics', (req, res) => {
  try {
    const { start, end } = req.query
    const startDate = new Date(start)
    const endDate = new Date(end)

    const totalCustomers = customersData.length

    // Total orders = count of products
    const totalOrders = productsData.length

    // Total revenue = sum of prices of all product variants
    const totalRevenue = productsData.reduce((sum, product) => {
      return sum + product.variants.reduce((variantSum, variant) => variantSum + parseFloat(variant.price), 0)
    }, 0)

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/orders', (req, res) => {
  try {
    const { start, end } = req.query
    const startDate = new Date(start)
    const endDate = new Date(end)

    const filteredOrders = ordersData.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startDate && orderDate <= endDate
    }).map(order => ({
      id: order.id,
      createdAt: order.created_at,
      totalPrice: parseFloat(order.total_price),
      customer: order.customer,
      line_items: order.line_items
    }))

    res.json(filteredOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/customers/top', (req, res) => {
  try {
    const customerTotals = {}

    ordersData.forEach(order => {
      const customerId = order.customer.id
      const totalPrice = parseFloat(order.total_price)
      if (customerTotals[customerId]) {
        customerTotals[customerId].totalSpent += totalPrice
      } else {
        customerTotals[customerId] = {
          id: customerId,
          email: order.customer.email || 'No Email',
          totalSpent: totalPrice
        }
      }
    })

    const topCustomers = Object.values(customerTotals)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    res.json(topCustomers)
  } catch (error) {
    console.error('Error fetching top customers:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// New endpoints for raw data
app.get('/api/customers', (req, res) => {
  res.json(customersData)
})

app.get('/api/products', (req, res) => {
  res.json(productsData)
})

// Scheduler to run data fetch and save daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled data ingestion...')
  exec('node fetchShopifyData.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching data: ${error}`)
      return
    }
    console.log(`Fetch stdout: ${stdout}`)
    if (stderr) console.error(`Fetch stderr: ${stderr}`)

    // After fetch, run save
    exec('node saveShopifyData.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error saving data: ${error}`)
        return
      }
      console.log(`Save stdout: ${stdout}`)
      if (stderr) console.error(`Save stderr: ${stderr}`)
    })
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
