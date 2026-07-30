/**
 * Environment Configuration for LOOP AI Customer Feedback Platform
 * Controls switching between Demo Mode and Production Database Mode.
 */

export const IS_DEMO_MODE: boolean = process.env.DEMO_MODE === "true";

export const APP_CONFIG = {
  isDemoMode: IS_DEMO_MODE,
  appName: "LOOP AI Customer Feedback Intelligence Platform",
  requireEmailVerification: !IS_DEMO_MODE,
  defaultPageSize: 10,
  maxPageSize: 100,
};
