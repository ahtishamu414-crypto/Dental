import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Email Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
CLINIC_NOTIFICATION_EMAIL = os.getenv("CLINIC_NOTIFICATION_EMAIL")
CLINIC_NAME = os.getenv("CLINIC_NAME", "Bright Smile Dental")
CLINIC_PHONE = os.getenv("CLINIC_PHONE", "(555) 555-5555")


class EmailService:
    """
    Service for sending email notifications.
    
    Supports appointment notifications to admin and patients.
    """
    
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.smtp_email = SMTP_EMAIL
        self.smtp_password = SMTP_PASSWORD
        self.clinic_email = CLINIC_NOTIFICATION_EMAIL
        self.clinic_name = CLINIC_NAME
        self.clinic_phone = CLINIC_PHONE
        
        if not self.smtp_email or not self.smtp_password:
            print("⚠️  Warning: SMTP credentials not configured. Emails will not be sent.")
    
    def _create_message(
        self,
        subject: str,
        body_html: str,
        to_email: str,
        from_name: Optional[str] = None
    ) -> MIMEMultipart:
        """
        Create an email message.
        
        Args:
            subject: Email subject
            body_html: HTML body content
            to_email: Recipient email address
            from_name: Sender name (optional)
            
        Returns:
            MIMEMultipart message object
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name or self.clinic_name} <{self.smtp_email}>"
        msg["To"] = to_email
        
        # Attach HTML content
        part = MIMEText(body_html, "html")
        msg.attach(part)
        
        return msg
    
    def _send_email(self, msg: MIMEMultipart) -> bool:
        """
        Send an email via SMTP.
        
        Args:
            msg: Email message object
            
        Returns:
            True if sent successfully, False otherwise
        """
        try:
            if not self.smtp_email or not self.smtp_password:
                print("⚠️  SMTP not configured. Email not sent.")
                print(f"   Would send to: {msg['To']}")
                print(f"   Subject: {msg['Subject']}")
                return False
            
            # Connect to SMTP server
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # Secure the connection
            server.login(self.smtp_email, self.smtp_password)
            
            # Send email
            server.send_message(msg)
            server.quit()
            
            print(f"✅ Email sent to: {msg['To']}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    def send_appointment_notification_to_admin(
        self,
        patient_name: str,
        patient_email: str,
        patient_phone: str,
        service_type: str,
        preferred_date: str,
        preferred_time: str,
        notes: Optional[str] = None,
        appointment_id: Optional[str] = None
    ) -> bool:
        """
        Send appointment notification to clinic admin.
        
        Args:
            patient_name: Patient's full name
            patient_email: Patient's email address
            patient_phone: Patient's phone number
            service_type: Requested dental service
            preferred_date: Preferred appointment date
            preferred_time: Preferred appointment time
            notes: Additional notes (optional)
            appointment_id: MongoDB appointment ID (optional)
            
        Returns:
            True if sent successfully, False otherwise
        """
        subject = f"🦷 New Appointment Request - {patient_name}"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .info-box {{ background-color: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .label {{ font-weight: bold; color: #333; }}
                .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                .action-btn {{ background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🦷 {self.clinic_name}</h1>
                <p>New Appointment Request</p>
            </div>
            
            <div class="content">
                <p>Hello Admin,</p>
                
                <p>A new appointment request has been submitted:</p>
                
                <div class="info-box">
                    <p><span class="label">Patient Name:</span> {patient_name}</p>
                    <p><span class="label">Email:</span> {patient_email}</p>
                    <p><span class="label">Phone:</span> {patient_phone}</p>
                    <p><span class="label">Service:</span> {service_type}</p>
                    <p><span class="label">Preferred Date:</span> {preferred_date}</p>
                    <p><span class="label">Preferred Time:</span> {preferred_time}</p>
                    {f'<p><span class="label">Notes:</span> {notes}</p>' if notes else ''}
                    {f'<p><span class="label">Appointment ID:</span> {appointment_id}</p>' if appointment_id else ''}
                </div>
                
                <p><strong>Action Required:</strong> Please review and confirm this appointment.</p>
                
                <p>
                    <a href="http://localhost:8000/docs" class="action-btn">View in Admin Panel</a>
                </p>
                
                <p>Best regards,<br>{self.clinic_name} AI Receptionist</p>
            </div>
            
            <div class="footer">
                <p>{self.clinic_name} | {self.clinic_phone}</p>
                <p>This is an automated notification. Please do not reply.</p>
            </div>
        </body>
        </html>
        """
        
        msg = self._create_message(subject, body_html, self.clinic_email)
        return self._send_email(msg)
    
    def send_appointment_confirmation_to_patient(
        self,
        patient_name: str,
        patient_email: str,
        service_type: str,
        appointment_date: str,
        appointment_time: str,
        clinic_address: Optional[str] = None,
        clinic_phone: Optional[str] = None,
        notes: Optional[str] = None,
        doctor_name: Optional[str] = None,
        duration_minutes: Optional[int] = None
    ) -> bool:
        """
        Send appointment confirmation to patient.
        
        Args:
            patient_name: Patient's full name
            patient_email: Patient's email address
            service_type: Confirmed dental service
            appointment_date: Confirmed appointment date
            appointment_time: Confirmed appointment time
            clinic_address: Clinic address (optional)
            clinic_phone: Clinic phone (optional)
            notes: Notes (optional)
            doctor_name: Assigned dentist/doctor (optional)
            duration_minutes: Estimated visit duration (optional)
            
        Returns:
            True if sent successfully, False otherwise
        """
        subject = f"✅ Appointment Confirmed - {self.clinic_name}"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .info-box {{ background-color: #e8f5e9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }}
                .label {{ font-weight: bold; color: #333; }}
                .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                .reminder {{ background-color: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>✅ Appointment Confirmed!</h1>
                <p>{self.clinic_name}</p>
            </div>
            
            <div class="content">
                <p>Dear {patient_name},</p>
                
                <p>Your dental appointment has been confirmed:</p>
                
                <div class="info-box">
                    <p><span class="label">🦷 Service:</span> {service_type}</p>
                    {f'<p><span class="label">👨‍⚕️ Dentist:</span> {doctor_name}</p>' if doctor_name else ''}
                    {f'<p><span class="label">⏱️ Duration:</span> {duration_minutes} minutes</p>' if duration_minutes else ''}
                    <p><span class="label">📅 Date:</span> {appointment_date}</p>
                    <p><span class="label">🕐 Time:</span> {appointment_time}</p>
                </div>
                
                <div class="reminder">
                    <p><strong>📝 Important Reminders:</strong></p>
                    <ul>
                        <li>Please arrive 15 minutes early to complete paperwork</li>
                        <li>Bring your photo ID and insurance card</li>
                        <li>Bring a list of current medications</li>
                        <li>If you need to cancel, please provide 24-hour notice</li>
                    </ul>
                </div>
                
                <p><strong>Clinic Location:</strong><br>
                {clinic_address or '123 Demo Avenue, New York, NY 10001'}<br>
                Phone: {clinic_phone or self.clinic_phone}</p>
                
                <p>If you need to reschedule or have any questions, please contact us.</p>
                
                <p>We look forward to seeing you!</p>
                
                <p>Best regards,<br>{self.clinic_name} Team</p>
            </div>
            
            <div class="footer">
                <p>{self.clinic_name} | {clinic_phone or self.clinic_phone}</p>
                <p>This is an automated confirmation. Please do not reply.</p>
            </div>
        </body>
        </html>
        """
        
        msg = self._create_message(subject, body_html, patient_email, self.clinic_name)
        return self._send_email(msg)
    
    def send_appointment_cancellation_to_patient(
        self,
        patient_name: str,
        patient_email: str,
        service_type: str,
        original_date: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Send appointment cancellation notification to patient.
        
        Args:
            patient_name: Patient's full name
            patient_email: Patient's email address
            service_type: Cancelled dental service
            original_date: Original appointment date
            reason: Cancellation reason (optional)
            
        Returns:
            True if sent successfully, False otherwise
        """
        subject = f"❌ Appointment Cancelled - {self.clinic_name}"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .info-box {{ background-color: #ffebee; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f44336; }}
                .footer {{ background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>❌ Appointment Cancelled</h1>
                <p>{self.clinic_name}</p>
            </div>
            
            <div class="content">
                <p>Dear {patient_name},</p>
                
                <p>Your appointment has been cancelled:</p>
                
                <div class="info-box">
                    <p><span class="label">🦷 Service:</span> {service_type}</p>
                    <p><span class="label">📅 Original Date:</span> {original_date}</p>
                    {f'<p><span class="label">Reason:</span> {reason}</p>' if reason else ''}
                </div>
                
                <p>If you would like to reschedule, please contact us at {self.clinic_phone}.</p>
                
                <p>We apologize for any inconvenience.</p>
                
                <p>Best regards,<br>{self.clinic_name} Team</p>
            </div>
            
            <div class="footer">
                <p>{self.clinic_name} | {self.clinic_phone}</p>
            </div>
        </body>
        </html>
        """
        
        msg = self._create_message(subject, body_html, patient_email, self.clinic_name)
        return self._send_email(msg)

    def send_password_reset_email(
        self,
        patient_name: str,
        patient_email: str,
        reset_code: str
    ) -> bool:
        """
        Send password reset verification code to user.
        
        Args:
            patient_name: User's full name
            patient_email: User's email address
            reset_code: 6-digit verification code or token
            
        Returns:
            True if sent successfully, False otherwise
        """
        subject = f"🔑 Password Reset Request - {self.clinic_name}"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background-color: #1597a5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 24px; border: 1px solid #d6e8ec; border-top: none; border-radius: 0 0 8px 8px; }}
                .code-box {{ background-color: #e8f6f8; border: 2px dashed #1597a5; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0; }}
                .code {{ font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0b2a4a; }}
                .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #777; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>{self.clinic_name}</h2>
                <p>Password Reset Request</p>
            </div>
            
            <div class="content">
                <p>Hello {patient_name},</p>
                <p>We received a request to reset the password for your account.</p>
                
                <p>Use the following verification code to complete your password reset. This code will expire in <strong>15 minutes</strong>:</p>
                
                <div class="code-box">
                    <div class="code">{reset_code}</div>
                </div>
                
                <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p>Best regards,<br>{self.clinic_name} Security Team</p>
            </div>
            
            <div class="footer">
                <p>{self.clinic_name} | {self.clinic_phone}</p>
            </div>
        </body>
        </html>
        """
        
        msg = self._create_message(subject, body_html, patient_email, self.clinic_name)
        return self._send_email(msg)


# Global email service instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """
    Get or create the email service instance.
    
    Returns:
        EmailService instance
    """
    global _email_service
    
    if _email_service is None:
        _email_service = EmailService()
    
    return _email_service