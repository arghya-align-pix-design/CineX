package com.cinex.exception;

/**
 * Thrown when a client exceeds the allowed request rate.
 * Caught by GlobalExceptionHandler and returned as 429 Too Many Requests.
 */
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
