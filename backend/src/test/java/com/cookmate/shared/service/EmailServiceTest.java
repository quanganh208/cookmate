package com.cookmate.shared.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, "noreply@cookmate.app", "Cookmate", 15);
        // Provide a real MimeMessage so MimeMessageHelper can populate it without NPE.
        when(mailSender.createMimeMessage())
                .thenAnswer(inv -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void sendPasswordResetEmail_Success_PassesMimeMessageWithTokenLink() throws Exception {
        emailService.sendPasswordResetEmail(
                "alice@example.com", "Alice", "cookmate://reset?token=abc123");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        MimeMessage sent = captor.getValue();
        assertEquals("Reset your Cookmate password", sent.getSubject());
        assertEquals(1, sent.getAllRecipients().length);
        assertEquals("alice@example.com", sent.getAllRecipients()[0].toString());

        String body = (String) sent.getContent();
        assertTrue(body.contains("cookmate://reset?token=abc123"), "body must contain reset link");
        assertTrue(body.contains("Alice"), "body should greet the user by name");
        assertTrue(body.contains("15 minutes"), "body should mention TTL");
    }

    @Test
    void sendPasswordResetEmail_NullDisplayName_UsesFallbackGreeting() throws Exception {
        emailService.sendPasswordResetEmail(
                "alice@example.com", null, "cookmate://reset?token=xyz");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        String body = (String) captor.getValue().getContent();
        assertTrue(body.contains("Hi there"), "fallback greeting should say 'Hi there'");
    }

    @Test
    void sendPasswordResetEmail_MailExceptionSwallowed() {
        doThrow(new MailSendException("smtp down")).when(mailSender).send(any(MimeMessage.class));

        // Must not propagate — fail-open semantics.
        assertDoesNotThrow(
                () ->
                        emailService.sendPasswordResetEmail(
                                "alice@example.com", "Alice", "cookmate://reset?token=abc"));
    }
}
