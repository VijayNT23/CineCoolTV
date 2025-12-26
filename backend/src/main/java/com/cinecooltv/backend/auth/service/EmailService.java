@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Your CineCoolTV OTP Code");
            message.setText(
                    "Your OTP code is: " + otp + "\n\n" +
                            "This code will expire in 5 minutes.\n\n" +
                            "If you did not request this, please ignore this email."
            );

            mailSender.send(message);
            log.info("✅ OTP email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("❌ OTP email failed for {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email");
        }
    }
}
