package com.example.backend.repository.projection;

import java.time.LocalDate;

public interface DailyCountProjection {
    LocalDate getDate();
    Long getTotal();
}


