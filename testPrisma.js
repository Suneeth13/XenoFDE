import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany()
  console.log('Tenants:', tenants)

  const customers = await prisma.customer.findMany()
  console.log('Customers:', customers)

  const products = await prisma.product.findMany()
  console.log('Products:', products)

  const orders = await prisma.order.findMany()
  console.log('Orders:', orders)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
