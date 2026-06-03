package com.cinex.service;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final StringRedisTemplate redisTemplate;
    private static final long LOCK_TTL_MINUTES = 10;

    private String lockKey(Long showId, String seatCode) {
        return "seat_lock:" + showId + ":" + seatCode;
    }

    public boolean lockSeat(Long showId, String seatCode, String userId) {
        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(
                    lockKey(showId, seatCode),
                    userId,
                    Duration.ofMinutes(LOCK_TTL_MINUTES)
                );
        return Boolean.TRUE.equals(success);
    }

    public void unlockSeat(Long showId, String seatCode) {
        redisTemplate.delete(lockKey(showId, seatCode));
    }

    public boolean isLocked(Long showId, String seatCode) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey(lockKey(showId, seatCode))
        );
    }

    public List<String> lockSeats(Long showId, List<String> seatCodes, String userId) {
        List<String> locked = new ArrayList<>();
        for (String seatCode : seatCodes) {
            if (lockSeat(showId, seatCode, userId)) {
                locked.add(seatCode);
            } else {
                // Failed — release all acquired locks
                locked.forEach(s -> unlockSeat(showId, s));
                return null; // null means locking failed
            }
        }
        return locked;
    }
}
