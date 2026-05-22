package com.cinex.service;

import org.springframework.stereotype.Service;

import com.cinex.dto.TheatreRequest;
import com.cinex.entity.Theatre;
import com.cinex.entity.User;
import com.cinex.repository.TheatreRepository;
import com.cinex.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TheatreService {

    private final TheatreRepository theatreRepository;
    private final UserRepository userRepository;

    public Theatre createTheatre(TheatreRequest request, String vendorEmail) {
        User vendor = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        Theatre theatre = new Theatre();
        theatre.setName(request.getName());
        theatre.setAddressLine(request.getAddressLine());
        theatre.setPincode(request.getPincode());
        theatre.setCity(request.getCity());
        theatre.setDistrict(request.getDistrict());
        theatre.setState(request.getState());
        theatre.setOpenTime(request.getOpenTime());
        theatre.setCloseTime(request.getCloseTime());
        theatre.setHasRecliner(request.isHasRecliner());
        theatre.setVendor(vendor);

        return theatreRepository.save(theatre);
    }

    public java.util.List<Theatre> getVendorTheatres(String vendorEmail) {
        User vendor = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        return theatreRepository.findByVendorId(vendor.getId());
    }

    public Theatre getLayout(Long theatreId){
        Theatre theatre= theatreRepository.findById(theatreId)
                .orElseThrow(()-> new RuntimeException("Theatre not found"));
        
        // Only load active sections
        theatre.getSections().removeIf(s -> !s.isActive());
        return theatre;
    }

}
