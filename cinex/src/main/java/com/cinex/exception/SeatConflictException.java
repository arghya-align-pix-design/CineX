package com.cinex.exception;

/**
 * Thrown when a seat booking operation fails due to a concurrent
 * modification — e.g., two users trying to book the same seat
 * at exactly the same time.
 */
public class SeatConflictException extends ConflictException {
    public SeatConflictException(String message) {
        super(message);
    }
}
