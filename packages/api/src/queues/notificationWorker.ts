/**
 * BullMQ notification worker.
 * Listens to the 'notifications' queue and processes async jobs.
 * Channel: Email only (customer confirmation + admin/tailor alert).
 *
 * Production-hardened:
 * - Every external call is wrapped in try/catch so one email
 *   failing never blocks the other.
 * - All data fields have safe defaults to prevent runtime crashes.
 */

import { Queue, Worker } from "bullmq";
import nodemailer from "nodemailer";
import Redis from "ioredis";
import { orderConfirmedEmail, statusUpdateEmail, adminOrderAlertEmail } from "../integrations/email/templates";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Separate Redis connections required for Queue and Worker in BullMQ
const queueConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const workerConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue instance (shared across handlers)
export const notificationQueue = new Queue("notifications", {
  connection: queueConnection,
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
 * 1. Sends confirmation email to customer
 * 2. Sends order alert email to admin/tailor (with full measurements)
 *
 * Each email is independent — if one fails, the other still fires.
 */
async function handleOrderConfirmed(jobData: {
  orderId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  productName?: string;
  deliveryDate?: string;
  measurement?: Record<string, unknown>;
  totalPrice?: number;
  fabricOption?: string;
  colorOption?: string;
  styleOption?: string;
}) {
  console.log(`[Worker] Processing order-confirmed for order ${jobData.orderId}`);

  const orderData = {
    id: jobData.orderId,
    productName: jobData.productName || "Custom Outfit",
    deliveryDate: jobData.deliveryDate
      ? new Date(jobData.deliveryDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    measurement: jobData.measurement as any,
    totalPrice: jobData.totalPrice ?? 0,
    fabricOption: jobData.fabricOption,
    colorOption: jobData.colorOption,
    styleOption: jobData.styleOption,
    customerName: jobData.userName || "Customer",
    customerEmail: jobData.userEmail,
  };

  // 1. Send confirmation email to customer (non-fatal)
  if (jobData.userEmail) {
    try {
      const emailTemplate = orderConfirmedEmail(orderData);
      await sendEmail(jobData.userEmail, emailTemplate.subject, emailTemplate.html);
      console.log(`[Worker] ✓ Confirmation email sent to ${jobData.userEmail}`);
    } catch (error) {
      console.error(
        `[Worker] ✗ Customer email failed for ${jobData.userEmail}:`,
        error instanceof Error ? error.message : error
      );
    }
  } else {
    console.warn(`[Worker] ⚠ No customer email for order ${jobData.orderId}, skipping`);
  }

  // 2. Send order alert email to admin/tailor (non-fatal)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      const adminTemplate = adminOrderAlertEmail(orderData);
      await sendEmail(adminEmail, adminTemplate.subject, adminTemplate.html);
      console.log(`[Worker] ✓ Admin alert email sent to ${adminEmail}`);
    } catch (error) {
      console.error(
        `[Worker] ✗ Admin email failed for ${adminEmail}:`,
        error instanceof Error ? error.message : error
      );
    }
  } else {
    console.warn(`[Worker] ⚠ No ADMIN_EMAIL configured, skipping admin alert`);
  }

  console.log(`[Worker] ✓ Order confirmation completed for order ${jobData.orderId}`);
}

/**
 * Handler for 'status-updated' job.
 * Notifies customer of status change via email.
 */
async function handleStatusUpdated(jobData: {
  orderId: string;
  userId: string;
  userEmail?: string;
  productName?: string;
  deliveryDate?: string;
  newStatus: string;
  note?: string;
  totalPrice?: number;
}) {
  console.log(`[Worker] Processing status-updated for order ${jobData.orderId}`);

  const orderData = {
    id: jobData.orderId,
    productName: jobData.productName || "Custom Outfit",
    deliveryDate: jobData.deliveryDate
      ? new Date(jobData.deliveryDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    totalPrice: jobData.totalPrice ?? 0,
  };

  // Send status update email (non-fatal)
  if (jobData.userEmail) {
    try {
      const emailTemplate = statusUpdateEmail(orderData, jobData.newStatus);
      await sendEmail(jobData.userEmail, emailTemplate.subject, emailTemplate.html);
      console.log(`[Worker] ✓ Status email sent to ${jobData.userEmail}`);
    } catch (error) {
      console.error(
        `[Worker] ✗ Status email failed for ${jobData.userEmail}:`,
        error instanceof Error ? error.message : error
      );
    }
  } else {
    console.warn(`[Worker] ⚠ No email for order ${jobData.orderId}, skipping status email`);
  }

  console.log(`[Worker] ✓ Status update completed for order ${jobData.orderId}`);
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
      connection: workerConnection,
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
let smtpTransporter: any = null;

function getTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/\s+/g, "").replace(/^["']|["']$/g, "") : undefined;
  const emailPass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, "").replace(/^["']|["']$/g, "") : undefined;

  if (!emailUser || !emailPass) {
    throw new Error("SMTP credentials missing or incomplete (EMAIL_USER or EMAIL_PASSWORD not set).");
  }

  smtpTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS on port 587
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
  return smtpTransporter;
}

async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[Worker] Sending email to ${to} with subject: ${subject}`);
  
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`[Worker] Using Resend API for email delivery to ${to}`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend API returned status ${response.status}: ${errText}`);
      }

      const result = await response.json() as any;
      console.log(`[Worker] ✓ Email delivered to ${to} via Resend (Id: ${result.id})`);
      return result;
    } catch (error) {
      console.error(`[Worker] ✗ Failed to send email to ${to} via Resend:`, error);
      throw error;
    }
  }

  // Fallback to Nodemailer SMTP
  try {
    const transporter = getTransporter();
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@jhaz-imprints.com",
      to,
      subject,
      html,
    });
    console.log(`[Worker] ✓ Email delivered to ${to} via SMTP (MessageId: ${result.messageId})`);
    return result;
  } catch (error) {
    console.error(`[Worker] ✗ Failed to send email to ${to} via SMTP:`, error);
    throw error; // Re-throw to be caught by the job handler
  }
}
