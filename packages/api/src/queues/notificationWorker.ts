/**
 * BullMQ notification worker.
 * Listens to the 'notifications' queue and processes async jobs.
 * Uses email templates and WhatsApp Cloud API integration.
 */

import { Queue, Worker } from "bullmq";
import nodemailer from "nodemailer";
import { orderConfirmedEmail, statusUpdateEmail } from "../integrations/email/templates";
import { sendTextMessage } from "../integrations/whatsapp/client";
import {
  orderConfirmedMessage,
  statusUpdatedMessage,
  newOrderAlertMessage,
} from "../integrations/whatsapp/messages";

// Queue instance (shared across handlers)
export const notificationQueue = new Queue("notifications", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

/**
 * Handler for 'order-confirmed' job.
 * Sends confirmation email and WhatsApp message to customer.
 * Also alerts tailor with complete measurement summary.
 */
async function handleOrderConfirmed(jobData: {
  orderId: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  userName?: string;
  productName: string;
  deliveryDate: string;
  measurement?: {
    bust?: number;
    waist?: number;
    hip?: number;
    shoulder?: number;
    sleeveLen?: number;
    height?: number;
  };
  totalPrice: number;
  fabricOption?: string;
  colorOption?: string;
  styleOption?: string;
  tailorName?: string;
}) {
  try {
    console.log(`[Worker] Processing order-confirmed for order ${jobData.orderId}`);

    const orderData = {
      id: jobData.orderId,
      productName: jobData.productName,
      deliveryDate: new Date(jobData.deliveryDate),
      measurement: jobData.measurement,
      totalPrice: jobData.totalPrice,
      fabricOption: jobData.fabricOption,
      colorOption: jobData.colorOption,
      styleOption: jobData.styleOption,
      customerName: jobData.userName,
      tailorName: jobData.tailorName || "Jhaz-imprints Team",
    };

    // Send HTML email to customer
    const emailTemplate = orderConfirmedEmail(orderData);
    await sendEmail(jobData.userEmail, emailTemplate.subject, emailTemplate.html);
    console.log(`[Worker] ✓ Email sent to ${jobData.userEmail}`);

    // Send WhatsApp message to customer
    if (jobData.userPhone) {
      const whatsappMessage = orderConfirmedMessage(orderData);
      const result = await sendTextMessage(jobData.userPhone, whatsappMessage);
      if (result.success) {
        console.log(`[Worker] ✓ WhatsApp sent to customer ${jobData.userPhone}`);
      } else {
        console.warn(`[Worker] WhatsApp failed for customer: ${result.error}`);
      }
    }

    // Send tailor alert with complete measurements
    const tailorPhone = process.env.TAILOR_PHONE;
    if (tailorPhone) {
      const tailorAlert = newOrderAlertMessage(orderData);
      const result = await sendTextMessage(tailorPhone, tailorAlert);
      if (result.success) {
        console.log(`[Worker] ✓ Tailor alert sent to ${tailorPhone}`);
      } else {
        console.warn(`[Worker] Tailor alert failed: ${result.error}`);
      }
    }

    console.log(`[Worker] ✓ Order confirmation completed for order ${jobData.orderId}`);
  } catch (error) {
    console.error(
      `[Worker] Error processing order-confirmed:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * Handler for 'status-updated' job.
 * Notifies customer of status change via email and WhatsApp.
 */
async function handleStatusUpdated(jobData: {
  orderId: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  productName: string;
  deliveryDate: string;
  newStatus: string;
  note?: string;
  totalPrice: number;
}) {
  try {
    console.log(`[Worker] Processing status-updated for order ${jobData.orderId}`);

    const orderData = {
      id: jobData.orderId,
      productName: jobData.productName,
      deliveryDate: new Date(jobData.deliveryDate),
      totalPrice: jobData.totalPrice,
    };

    // Send status update email
    const emailTemplate = statusUpdateEmail(orderData, jobData.newStatus);
    await sendEmail(jobData.userEmail, emailTemplate.subject, emailTemplate.html);
    console.log(`[Worker] ✓ Status email sent to ${jobData.userEmail}`);

    // Send WhatsApp status update
    if (jobData.userPhone) {
      const whatsappMessage = statusUpdatedMessage(orderData, jobData.newStatus);
      const result = await sendTextMessage(jobData.userPhone, whatsappMessage);
      if (result.success) {
        console.log(`[Worker] ✓ Status WhatsApp sent to ${jobData.userPhone}`);
      } else {
        console.warn(`[Worker] Status WhatsApp failed: ${result.error}`);
      }
    }

    console.log(`[Worker] ✓ Status update completed for order ${jobData.orderId}`);
  } catch (error) {
    console.error(
      `[Worker] Error processing status-updated:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * Create and start the worker.
 */
export function startNotificationWorker() {
  const worker = new Worker(
    "notifications",
    async (job) => {
      switch (job.name) {
        case "order-confirmed":
          await handleOrderConfirmed(job.data);
          break;
        case "status-updated":
          await handleStatusUpdated(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// --- Email Helper ---

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@jhaz-imprints.com",
    to,
    subject,
    html,
  });
}
