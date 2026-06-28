const { neon } = require("@neondatabase/serverless");

const DB_URL =
  "process.env.DATABASE_URL";

const sql = neon(DB_URL);

const CLERK_USER_ID = "user_3EuR8w1F85kArYFIXUMfRsXzLtF";

const PRODUCT_IDS = {
  aac4: "e1658b75-02cb-4ee9-aafd-4b69353562f2",
  aac6: "981c0fb3-47cf-443c-834c-02e79af38f0f",
  aac8: "e508cf54-51d9-4a71-aca3-6e8c708059f1",
  aac9: "28f180f2-a3eb-4117-b16f-77f054cfc863",
  redNormal: "16ab3ec2-e8fe-4cdb-97fe-54e1613df56a",
  redKarimnagar: "792940df-847c-4165-9574-2b330e36eff4",
};

async function main() {
  // Get or create user
  let userRes = await sql.query("SELECT id FROM users WHERE clerk_id = $1", [CLERK_USER_ID]);
  if (userRes.length === 0) {
    const ins = await sql.query("INSERT INTO users (clerk_id) VALUES ($1) RETURNING id", [CLERK_USER_ID]);
    userRes = ins;
  }
  const userId = userRes[0].id;
  console.log("User ID:", userId);

  // Clear existing demo data
  await sql.query("DELETE FROM constr_visits");
  await sql.query("DELETE FROM constr_followups");
  await sql.query("DELETE FROM constr_order_items");
  await sql.query("DELETE FROM constr_orders");
  await sql.query("DELETE FROM constr_leads");
  await sql.query("DELETE FROM constr_customers");
  console.log("Cleared existing data");

  // Create customers
  const customers = [
    { name: "Rajesh Kumar Builders", phone: "9876543210", whatsapp: "9876543210", email: "rajesh@rkbuilders.com", address: "123 MG Road", city: "Hyderabad", district: "Rangareddy", state: "Telangana", pincode: "500001", type: "builder" },
    { name: "Priya Constructions", phone: "9876543211", whatsapp: "9876543211", email: "priya@priyaconst.com", address: "456 Jubilee Hills", city: "Hyderabad", district: "Rangareddy", state: "Telangana", pincode: "500033", type: "contractor" },
    { name: "Suresh Reddy", phone: "9876543212", whatsapp: "9876543212", email: null, address: "789 Banjara Hills", city: "Hyderabad", district: "Rangareddy", state: "Telangana", pincode: "500034", type: "individual" },
    { name: "Vamsi Infra", phone: "9876543213", whatsapp: "9876543213", email: "vamsi@vamsiinfra.com", address: "321 Gachibowli", city: "Hyderabad", district: "Rangareddy", state: "Telangana", pincode: "500032", type: "builder" },
    { name: "Lakshmi Traders", phone: "9876543214", whatsapp: "9876543214", email: "lakshmi@lakshmitraders.com", address: "654 Ameerpet", city: "Hyderabad", district: "Rangareddy", state: "Telangana", pincode: "500016", type: "dealer" },
  ];

  const customerIds = [];
  for (const c of customers) {
    const res = await sql.query(
      `INSERT INTO constr_customers (user_id, name, phone, whatsapp, email, address, city, district, state, pincode, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [userId, c.name, c.phone, c.whatsapp, c.email, c.address, c.city, c.district, c.state, c.pincode, c.type]
    );
    customerIds.push(res[0].id);
  }
  console.log("Created", customerIds.length, "customers");

  // Create leads
  const leads = [
    { customerId: 0, projectName: "Skyline Apartments Phase 2", siteAddress: "HITEC City", city: "Hyderabad", projectType: "residential", estimatedValue: 2500000, productInterest: ["aac_block"], estimatedQuantity: 5000, quantityUnit: "pieces", stage: "quoted" },
    { customerId: 1, projectName: "Green Valley Township", siteAddress: "Kondapur", city: "Hyderabad", projectType: "residential", estimatedValue: 1800000, productInterest: ["aac_block", "red_brick"], estimatedQuantity: 3000, quantityUnit: "pieces", stage: "requirement_received" },
    { customerId: 2, projectName: "Suresh Villa", siteAddress: "Bowrampally", city: "Hyderabad", projectType: "residential", estimatedValue: 500000, productInterest: ["red_brick"], estimatedQuantity: 800, quantityUnit: "pieces", stage: "contacted" },
    { customerId: 3, projectName: "Vamsi Commercial Complex", siteAddress: "Financial District", city: "Hyderabad", projectType: "commercial", estimatedValue: 4000000, productInterest: ["aac_block"], estimatedQuantity: 8000, quantityUnit: "pieces", stage: "new" },
    { customerId: 4, projectName: "Dealer Stock Order", siteAddress: "Ameerpet Warehouse", city: "Hyderabad", projectType: "residential", estimatedValue: 800000, productInterest: ["red_brick"], estimatedQuantity: 2000, quantityUnit: "pieces", stage: "won" },
  ];

  const leadIds = [];
  for (const l of leads) {
    const res = await sql.query(
      `INSERT INTO constr_leads (user_id, customer_id, project_name, site_address, city, project_type, estimated_value, product_interest, estimated_quantity, quantity_unit, stage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [userId, customerIds[l.customerId], l.projectName, l.siteAddress, l.city, l.projectType, l.estimatedValue, l.productInterest, l.estimatedQuantity, l.quantityUnit, l.stage]
    );
    leadIds.push(res[0].id);
  }
  console.log("Created", leadIds.length, "leads");

  // Create orders
  const orders = [
    { customerId: 0, leadId: 0, orderNumber: "ORD-2026-001", status: "delivered", totalAmount: 175000, discountAmount: 5000, finalAmount: 170000, deliveryAddress: "HITEC City Site", notes: "Phase 1 delivery" },
    { customerId: 1, leadId: 1, orderNumber: "ORD-2026-002", status: "dispatched", totalAmount: 96000, discountAmount: 0, finalAmount: 96000, deliveryAddress: "Kondapur Site", notes: "Urgent delivery" },
    { customerId: 4, leadId: 4, orderNumber: "ORD-2026-003", status: "pending", totalAmount: 48000, discountAmount: 2000, finalAmount: 46000, deliveryAddress: "Ameerpet Warehouse", notes: "Bulk order" },
  ];

  const orderIds = [];
  for (const o of orders) {
    const res = await sql.query(
      `INSERT INTO constr_orders (user_id, customer_id, lead_id, order_number, order_date, status, total_amount, discount_amount, final_amount, delivery_address, notes)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [userId, customerIds[o.customerId], leadIds[o.leadId], o.orderNumber, o.status, o.totalAmount, o.discountAmount, o.finalAmount, o.deliveryAddress, o.notes]
    );
    orderIds.push(res[0].id);
  }
  console.log("Created", orderIds.length, "orders");

  // Create order items
  const orderItems = [
    { orderId: 0, productId: PRODUCT_IDS.aac8, quantity: 2000, unitPrice: 80 },
    { orderId: 0, productId: PRODUCT_IDS.aac6, quantity: 500, unitPrice: 75 },
    { orderId: 1, productId: PRODUCT_IDS.aac4, quantity: 1200, unitPrice: 80 },
    { orderId: 2, productId: PRODUCT_IDS.redNormal, quantity: 1000, unitPrice: 48 },
  ];

  for (const item of orderItems) {
    await sql.query(
      `INSERT INTO constr_order_items (order_id, product_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderIds[item.orderId], item.productId, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
    );
  }
  console.log("Created", orderItems.length, "order items");

  // Create follow-ups
  const followups = [
    { leadId: 0, followupDate: "2026-07-02", followupTime: "10:00", type: "call", priority: "high", status: "pending", notes: "Follow up on Phase 2 quotation" },
    { leadId: 1, followupDate: "2026-07-01", followupTime: "14:00", type: "site_visit", priority: "high", status: "pending", notes: "Site visit to check progress" },
    { leadId: 2, followupDate: "2026-06-28", followupTime: "11:00", type: "whatsapp", priority: "medium", status: "completed", notes: "Sent product catalog via WhatsApp", completedAt: new Date("2026-06-28T11:15:00") },
    { leadId: 3, followupDate: "2026-07-05", followupTime: "15:00", type: "meeting", priority: "high", status: "pending", notes: "Initial meeting with Vamsi Infra team" },
    { leadId: 4, followupDate: "2026-06-25", followupTime: "09:00", type: "call", priority: "low", status: "completed", notes: "Confirmed bulk order details", completedAt: new Date("2026-06-25T09:30:00") },
    { leadId: 0, followupDate: "2026-06-20", followupTime: "16:00", type: "email", priority: "medium", status: "completed", notes: "Sent quotation via email", completedAt: new Date("2026-06-20T16:05:00") },
  ];

  for (const f of followups) {
    await sql.query(
      `INSERT INTO constr_followups (lead_id, user_id, followup_date, followup_time, type, priority, status, notes, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [leadIds[f.leadId], userId, f.followupDate, f.followupTime, f.type, f.priority, f.status, f.notes, f.completedAt || null]
    );
  }
  console.log("Created", followups.length, "follow-ups");

  // Create visits
  const visits = [
    { leadId: 0, checkInTime: new Date("2026-06-15T10:00:00"), checkOutTime: new Date("2026-06-15T11:30:00"), durationMinutes: 90, notes: "Met with site engineer, discussed block requirements" },
    { leadId: 1, checkInTime: new Date("2026-06-18T14:00:00"), checkOutTime: new Date("2026-06-18T15:00:00"), durationMinutes: 60, notes: "Initial site survey, will follow up" },
    { leadId: 4, checkInTime: new Date("2026-06-22T09:00:00"), checkOutTime: new Date("2026-06-22T09:45:00"), durationMinutes: 45, notes: "Warehouse visit, confirmed stock requirements" },
  ];

  for (const v of visits) {
    await sql.query(
      `INSERT INTO constr_visits (lead_id, user_id, check_in_time, check_out_time, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [leadIds[v.leadId], userId, v.checkInTime, v.checkOutTime, v.durationMinutes, v.notes]
    );
  }
  console.log("Created", visits.length, "visits");

  console.log("\n=== SEED COMPLETE ===");
  console.log("Customers:", customerIds.length);
  console.log("Leads:", leadIds.length);
  console.log("Orders:", orderIds.length);
  console.log("Order Items:", orderItems.length);
  console.log("Follow-ups:", followups.length);
  console.log("Visits:", visits.length);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
