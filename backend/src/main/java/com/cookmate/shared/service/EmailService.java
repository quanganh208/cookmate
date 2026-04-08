package com.cookmate.shared.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email delivery abstraction. Uses Spring's {@link JavaMailSender} under the hood (auto-wired from
 * {@code spring.mail.*} properties). All send methods are annotated with {@link Async} so HTTP
 * request handlers are not blocked by SMTP latency. Delivery failures are logged but never
 * propagated to the caller (fail-open so the API response stays generic).
 */
@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;
    private final int tokenTtlMinutes;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:noreply@cookmate.app}") String fromAddress,
            @Value("${app.mail.from-name:Cookmate}") String fromName,
            @Value("${app.password-reset.token-ttl-minutes:15}") int tokenTtlMinutes) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.tokenTtlMinutes = tokenTtlMinutes;
    }

    /**
     * Send a password reset email with a tokenised link. Runs asynchronously; failures are logged
     * but swallowed so callers always see a generic success response.
     *
     * @param toEmail recipient address
     * @param displayName user's display name (used in greeting)
     * @param resetLink full URL with token query param (e.g. {@code cookmate://reset?token=xxx})
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String displayName, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(new InternetAddress(fromAddress, fromName, "UTF-8"));
            helper.setTo(toEmail);
            helper.setSubject("Reset your Cookmate password");
            helper.setText(buildResetEmailHtml(displayName, resetLink), true);
            mailSender.send(message);
            log.info("Password reset email dispatched to {}", toEmail);
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            // Never throw — callers rely on fail-open semantics.
            log.warn("Failed to send password reset email to {}: {}", toEmail, ex.getMessage());
        }
    }

    /** Inline HTML template. Kept tiny and dependency-free on purpose (YAGNI). */
    private String buildResetEmailHtml(String displayName, String resetLink) {
        String safeName = displayName == null || displayName.isBlank() ? "there" : displayName;
        // The reset link is built from config (base URL) + a server-generated token, but the
        // base URL is operator-controlled; escape defensively so a misconfigured URL containing
        // quotes or angle brackets can't break the HTML markup or bleed into adjacent tags.
        String safeLink = escapeHtml(resetLink);
        return "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; color:"
                + " #333;\">"
                + "<h2 style=\"color:#FF7A3D;\">Cookmate</h2>"
                + "<p>Hi "
                + escapeHtml(safeName)
                + ",</p>"
                + "<p>We received a request to reset the password for your account. "
                + "Tap the button below to continue:</p>"
                + "<p><a href=\""
                + safeLink
                + "\" style=\"display:inline-block;padding:12px 24px;"
                + "background:#FF7A3D;color:#fff;text-decoration:none;border-radius:6px;\">"
                + "Reset password</a></p>"
                + "<p>Or copy this link into your browser:<br/><code>"
                + safeLink
                + "</code></p>"
                + "<p><strong>This link will expire in "
                + tokenTtlMinutes
                + " minutes.</strong></p>"
                + "<p>If you did not request a password reset, please ignore this email.</p>"
                + "<hr/><p style=\"font-size:12px;color:#888;\">Cookmate — Your recipe sharing"
                + " companion.</p></body></html>";
    }

    /** Minimal HTML escaper for user-supplied fields. */
    private String escapeHtml(String input) {
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
