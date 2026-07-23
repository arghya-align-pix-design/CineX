package com.cinex;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.cinex.service.SeatLockService;

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

        // 1. ADDED: A thread-safe container to store the username of the winner
        //java.util.concurrent.atomic.AtomicReference<String> winningUser = new java.util.concurrent.atomic.AtomicReference<>();

        // 2. MODIFIED: Two different latches for two different jobs
        CountDownLatch latch = new CountDownLatch(threadCount);
        //CountDownLatch startGun = new CountDownLatch(1); // The "Go!" signal
        //CountDownLatch finishLatch = new CountDownLatch(threadCount); // Tracks when everyone is done
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final String userId = "user" + i + "@test.com";
            executor.submit(() -> {
                try {
                    //readyLatch.countDown(); // Tell the main thread "I am ready and waiting"
                    //startGun.await(); // STOP HERE and wait for the gunshot!

                    boolean locked = seatLockService.lockSeat(showId, seatCode, userId);
                    if (locked){
                        successCount.incrementAndGet();
                        //winningUser.set(userId); // Record who won
                    }

                    else failCount.incrementAndGet();
                }
                finally {
                    latch.countDown();
                }
            });
        }

        latch.await(); // Wait for all threads to finish
        executor.shutdown();

        System.out.println("Success: " + successCount.get());
        System.out.println("Failed: " + failCount.get());
        //System.out.println("The Winner Is: " + winningUser.get()); // Prints the winning user

        // Exactly 1 should succeed, 9 should fail
        assert successCount.get() == 1 : "Expected 1 success, got " + successCount.get();
        assert failCount.get() == 9 : "Expected 9 failures, got " + failCount.get();
        //assert winningUser.get() != null : "Expected a winner to be recorded";
    }
}