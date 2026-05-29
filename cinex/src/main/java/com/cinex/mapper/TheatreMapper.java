package com.cinex.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.cinex.dto.SectionResponse;
import com.cinex.dto.TheatreResponse;
import com.cinex.entity.Section;
import com.cinex.entity.Theatre;

@Mapper(componentModel = "spring")
public interface TheatreMapper {
    @Mapping(target = "sections", source= "sections")
    TheatreResponse toResponse(Theatre theatre);

    @Mapping(target = "seatType", expression = "java(section.getSeatType().name())")
    @Mapping(target = "active", source = "active")
    SectionResponse toSectionResponse(Section section);
}
