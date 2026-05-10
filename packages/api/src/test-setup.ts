/**
 * Global test setup for vitest.
 * Runs before every test file in the suite.
 *
 * Responsibilities:
 *  1. Mock all external services so tests never make real network calls:
 *     - BullMQ / Redis
 *     - Nodemailer (email)
 *     - Twilio (WhatsApp)
 *     - Cloudinary (image uploads)
 *  2. notificationWorker.ts instantiates `new Queue(...)` at module scope.
 *     Without the BullMQ mock, importing orderService.ts triggers a Redis
 *     connection attempt which panics if Redis is not running.
 */

import { vi } from "vitest";

// ── BullMQ / Redis ────────────────────────────────────────────────────────────
vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// ── Nodemailer ────────────────────────────────────────────────────────────────
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    })),
  },
}));

// ── Twilio ────────────────────────────────────────────────────────────────────
vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: "SM_mock_sid" }),
    },
  })),
}));

// ── Cloudinary ────────────────────────────────────────────────────────────────
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));