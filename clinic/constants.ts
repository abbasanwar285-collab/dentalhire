/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers
 */

// Financial thresholds
export const FINANCIAL = {
    /** High debt threshold in IQD - patients above this are flagged */
    HIGH_DEBT_THRESHOLD: 500000,
    /** Consultation fee amount in IQD */
    CONSULTATION_FEE: 5000,
};

// Sync & Network
export const SYNC = {
    /** Auto-sync interval in milliseconds (30 seconds) */
    AUTO_SYNC_INTERVAL_MS: 30000,
    /** Max retry count for failed sync operations */
    MAX_SYNC_RETRIES: 5,
    /** Network check timeout in milliseconds */
    NETWORK_CHECK_TIMEOUT_MS: 5000,
    /** Debounce time for realtime updates in milliseconds */
    REALTIME_DEBOUNCE_MS: 2000,
};

// AI & Learning
export const AI = {
    /** Max decision history items to keep */
    MAX_DECISION_HISTORY: 50,
    /** Max prediction history items to keep */
    MAX_PREDICTION_HISTORY: 100,
    /** Time window for sequence tracking (10 minutes) */
    SEQUENCE_TIME_WINDOW_MS: 10 * 60 * 1000,
    /** Peak hour threshold percentage (top 30%) */
    PEAK_HOUR_THRESHOLD: 0.7,
};

// Patient management
export const PATIENT = {
    /** Days before follow-up reminder */
    FOLLOW_UP_DAYS: 30,
    /** Max patients to fetch per query (performance) */
    MAX_FETCH_LIMIT: 100,
};

// Cache
export const CACHE = {
    /** Visibility change disconnect delay (30 seconds) */
    VISIBILITY_DISCONNECT_DELAY_MS: 30000,
};
