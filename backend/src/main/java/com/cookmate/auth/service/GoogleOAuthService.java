package com.cookmate.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Verifies Google ID tokens received from the mobile app. */
@Service
public class GoogleOAuthService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleOAuthService(@Value("${app.auth.google.client-id}") String clientId) {
        this.verifier =
                new GoogleIdTokenVerifier.Builder(
                                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(Collections.singletonList(clientId))
                        .build();
    }

    /**
     * Verify a Google ID token and extract user info.
     *
     * @param idToken the token from Google Sign-In on mobile
     * @return verified user info
     * @throws GoogleAuthException if token is invalid
     */
    public GoogleUserInfo verify(String idToken) {
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new GoogleAuthException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = token.getPayload();
            return new GoogleUserInfo(
                    payload.getSubject(),
                    payload.getEmail(),
                    (String) payload.get("name"),
                    (String) payload.get("picture"));
        } catch (GoogleAuthException e) {
            throw e;
        } catch (Exception e) {
            throw new GoogleAuthException("Failed to verify Google ID token: " + e.getMessage());
        }
    }

    /** Verified Google user info record. */
    public record GoogleUserInfo(String providerId, String email, String name, String picture) {}

    /** Exception for Google OAuth verification failures. */
    public static class GoogleAuthException extends RuntimeException {
        public GoogleAuthException(String message) {
            super(message);
        }
    }
}
