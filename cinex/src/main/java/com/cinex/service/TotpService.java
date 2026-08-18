package com.cinex.service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

import org.springframework.stereotype.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

@Service
public class TotpService {
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public String generateSecret() {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    public boolean validateCode(String secret, int code) {
        return gAuth.authorize(secret, code);
    }

    /**
     * Generates a scannable QR code image as a Base64 data URI.
     * 
     * The QR encodes a standard otpauth:// URI that authenticator apps
     * (Google Authenticator, Authy, etc.) recognize automatically:
     *   otpauth://totp/CineX:admin@email.com?secret=XXXX&issuer=CineX
     * 
     * @param secret  the TOTP Base32 secret key
     * @param email   the admin's email (used as the account label)
     * @return        a data:image/png;base64,... string ready to use as img src
     */
    public String generateQrCodeDataUri(String secret, String email) {
        try {
            // Build the standard otpauth URI that authenticator apps understand
            String otpauthUri = String.format(
                "otpauth://totp/CineX:%s?secret=%s&issuer=CineX",
                email, secret
            );

            // Use ZXing to render the URI as a QR code bitmap
            QRCodeWriter qrWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrWriter.encode(otpauthUri, BarcodeFormat.QR_CODE, 250, 250);

            // Convert the bitmap to a PNG byte array
            ByteArrayOutputStream pngStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngStream);

            // Base64-encode the PNG so it can be embedded directly in HTML
            String base64 = Base64.getEncoder().encodeToString(pngStream.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
}
