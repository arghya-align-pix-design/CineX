package com.cinex;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.cinex.service.SeatLockService;

/**
 * Concurrency test for the Redis-based seat locking layer.
 * 
 * This test fires 10 threads at the same seat simultaneously.
 * Redis SETNX is atomic — exactly 1 should win, 9 should fail.
 * 
 * NOTE: Requires a running Redis instance on localhost:6379.
 * The full Postgres-layer locking is tested in BookingServiceTest
 * using mocks (no live DB or Redis required).
 */
@SpringBootTest
@ActiveProfiles("test")
public class BookingConcurrencyTest {

    @Autowired
    private SeatLockService seatLockService;

    @Test
    public void testConcurrentSeatLocking() throws InterruptedException {
        Long showId = 1L;
        String seatCode = "A5";
        int threadCount = 10;

        // Ensure key is cleared before starting concurrency test
        seatLockService.unlockSeat(showId, seatCode);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        AtomicReference<String> winningUser = new AtomicReference<>();

        // Two-latch pattern for maximum concurrency:
        // readyLatch — all threads signal "I'm ready"
        // startGun — main thread fires "Go!" once everyone is ready
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startGun = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final String userId = "user" + i + "@test.com";
            executor.submit(() -> {
                try {
                    readyLatch.countDown();   // Signal "I'm ready and waiting"
                    startGun.await();         // Wait for the "Go!" signal

                    boolean locked = seatLockService.lockSeat(showId, seatCode, userId);
                    if (locked) {
                        successCount.incrementAndGet();
                        winningUser.set(userId);
                    } else {
                        failCount.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        readyLatch.await();   // Wait until all threads are ready
        startGun.countDown(); // Fire! All threads race at once
        finishLatch.await();  // Wait for all threads to finish
        executor.shutdown();

        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║   CONCURRENT SEAT LOCKING RESULTS   ║");
        System.out.println("╠══════════════════════════════════════╣");
        System.out.println("║ Threads fired:  " + threadCount + "                   ║");
        System.out.println("║ Lock successes: " + successCount.get() + "                    ║");
        System.out.println("║ Lock failures:  " + failCount.get() + "                    ║");
        System.out.println("║ Winner:         " + winningUser.get());
        System.out.println("╚══════════════════════════════════════╝");

        // Exactly 1 should succeed, 9 should fail
        assert successCount.get() == 1 : "Expected 1 success, got " + successCount.get();
        assert failCount.get() == threadCount - 1 : "Expected " + (threadCount - 1) + " failures, got " + failCount.get();
        assert winningUser.get() != null : "Expected a winner to be recorded";

        // Cleanup
        seatLockService.unlockSeat(showId, seatCode);
    }

    @Test
    public void testMultiSeatLocking_AllOrNothing() throws InterruptedException {
        Long showId = 2L;

        // Pre-lock seat B3 by a different user to simulate contention
        seatLockService.lockSeat(showId, "B3", "blocker@test.com");

        // Now try to lock B1, B2, B3 together — should fail entirely
        // because B3 is already taken, and B1+B2 should be rolled back
        var result = seatLockService.lockSeats(showId,
                java.util.List.of("B1", "B2", "B3"), "buyer@test.com");

        assert result == null : "Expected null (failure) when one seat is already locked";

        // Verify B1 and B2 were properly rolled back (not left locked)
        assert !seatLockService.isLocked(showId, "B1") : "B1 should have been rolled back";
        assert !seatLockService.isLocked(showId, "B2") : "B2 should have been rolled back";

        // Cleanup
        seatLockService.unlockSeat(showId, "B3");

        System.out.println("✓ Multi-seat all-or-nothing rollback test passed");
    }
}