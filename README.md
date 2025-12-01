# XenoFDE - Shopify Data Ingestion Service

## Project Overview

XenoFDE is a data ingestion service for Shopify stores, providing a backend API for fetching and storing customer, product, and order data, along with a React dashboard for visualizing key metrics and insights.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- A Shopify store with Admin API access
- Database (e.g., PostgreSQL, SQLite) for Prisma

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/Suneeth13/XenoFDE.git
   cd XenoFDE
   ```

2. Install dependencies:
   ```
   npm install
   cd dashboard
   npm install
   cd ..
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   SHOPIFY_STORE=your-shopify-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-admin-api-access-token
   SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
   DATABASE_URL=your-database-url
   PORT=3000
   ```

4. Set up Prisma:
   ```
   npx prisma migrate dev
   npx prisma generate
   ```

5. Run the data fetch script (optional, to populate initial data):
   ```
   node fetchShopifyData.js
   ```

6. Start the server:
   ```
   npm start
   ```

7. In a separate terminal, start the dashboard:
   ```
   cd dashboard
   npm start
   ```

The server will run on http://localhost:3000 and the dashboard on http://localhost:3001.

## Architecture

The application consists of:
- **Express Server**: Handles API requests, webhooks, and data ingestion.
- **React Dashboard**: Frontend for visualizing data.
- **Prisma Database**: Stores structured data.
- **Shopify API**: Source of customer, product, and order data.

### Architecture Diagram

```
[Shopify Store] --> Webhooks --> [Express Server]
                        |
                        |--> API Calls --> [React Dashboard]
                        |
                        |--> Cron Job --> [fetchShopifyData.js] --> JSON Files
                        |
                        |--> [saveShopifyData.js] --> [Prisma Database]
```

Data Flow:
1. Shopify sends webhooks for events like cart abandoned or checkout started.
2. Scheduled cron job fetches data from Shopify API and saves to JSON files.
3. Data is upserted into the Prisma database.
4. Dashboard queries the API for metrics and displays visualizations.

## API Endpoints

### Health Check
- `GET /`: Returns service status.

### Webhooks
- `POST /webhooks/cart/abandoned`: Receives cart abandoned events.
- `POST /webhooks/checkout/started`: Receives checkout started events.

### Data APIs
- `GET /api/metrics?start=YYYY-MM-DD&end=YYYY-MM-DD`: Returns total customers, orders, and revenue.
- `GET /api/orders?start=YYYY-MM-DD&end=YYYY-MM-DD`: Returns orders within date range.
- `GET /api/customers/top`: Returns top 5 customers by total spent.
- `GET /api/customers`: Returns raw customer data.
- `GET /api/products`: Returns raw product data.

All endpoints return JSON responses.

## DB Schema

The database schema is defined using Prisma:

- **Tenant**: Represents a Shopify store tenant.
  - `id`: String (Primary Key)
  - `name`: String

- **Customer**: Customer information.
  - `id`: String (Primary Key)
  - `tenantId`: String (Foreign Key to Tenant)
  - `shopifyId`: String (Unique)
  - `email`: String
  - `firstName`: String
  - `lastName`: String
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

- **Product**: Product details.
  - `id`: String (Primary Key)
  - `tenantId`: String (Foreign Key)
  - `shopifyId`: String (Unique)
  - `title`: String
  - `handle`: String
  - `productType`: String
  - `vendor`: String
  - `status`: String
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

- **ProductVariant**: Product variants.
  - `id`: String (Primary Key)
  - `productId`: String (Foreign Key to Product)
  - `shopifyId`: String (Unique)
  - `title`: String
  - `sku`: String
  - `price`: String
  - `compareAtPrice`: String?
  - `inventoryQuantity`: Int
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

- **Order**: Order information.
  - `id`: String (Primary Key)
  - `tenantId`: String (Foreign Key)
  - `shopifyId`: String (Unique)
  - `customerId`: String (Foreign Key to Customer)
  - `totalPrice`: String
  - `subtotalPrice`: String
  - `totalTax`: String
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

- **OrderLineItem**: Order line items.
  - `id`: String (Primary Key)
  - `orderId`: String (Foreign Key to Order)
  - `productVariantId`: String (Foreign Key to ProductVariant)
  - `quantity`: Int
  - `price`: String
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

## Limitations

- Currently, only customer data is fully saved to the database; products and orders are stored in JSON files.
- No authentication or authorization on API endpoints.
- Webhooks are logged but not processed for business logic.
- Dashboard assumes Firebase authentication is configured.
- No error handling for API rate limits or network failures.
- Metrics are calculated from JSON data, not optimized for large datasets.
- No pagination or filtering on data endpoints.
- Cron job runs daily at midnight; no configurable scheduling.
- Assumes single tenant; multi-tenant support is partially implemented.
