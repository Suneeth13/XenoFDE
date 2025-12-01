import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveCustomers(customers, tenantId) {
  for (const cust of customers) {
    const shopifyId = cust.id.toString();

    const createData = {
      tenant: { connect: { id: tenantId } },
      shopifyId,
      email: cust.email ?? "",
      firstName: cust.first_name ?? "",
      lastName: cust.last_name ?? "",
    };

    const updateData = {
      email: cust.email ?? "",
      firstName: cust.first_name ?? "",
      lastName: cust.last_name ?? "",
    };

    await prisma.customer.upsert({
      where: { shopifyId },
      update: updateData,
      create: createData,
    });
  }

  console.log("Customers saved to DB!");
}
