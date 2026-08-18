package com.cinex.entity;

/**
 * All auditable actions in the system.
 * Each represents a "who did what" event worth recording.
 */
public enum AuditAction {
    VENDOR_SUSPENDED,
    VENDOR_REACTIVATED,
    VENDOR_BANNED,
    VENDOR_DELETED,
    VENDOR_INVITED,
    MOVIE_CREATED,
    MOVIE_UPDATED,
    MOVIE_TOGGLED,
    SHOW_CREATED,
    SHOW_CANCELLED,
    BOOKING_CONFIRMED,
    BOOKING_AUTO_CANCELLED
}
