# Kavenegar SMS Gateway Integration
# Replaces LinduTicket_Site.Classes.Kavenegar_SMS_Manage

class KavenegarSmsService:
    @staticmethod
    async def send_ticket_sms(mobile: str, customer_name: str, event_title: str, ticket_code: str):
        """
        Sends SMS to buyer with ticket download link and factor number
        """
        message = (
            f"سلام {customer_name} عزیز\n"
            f"خرید بلیت شما برای «{event_title}» با موفقیت انجام شد.\n"
            f"شماره بلیت: {ticket_code}\n"
            f"جهت مشاهده و دانلود بلیت به gishow.ir مراجعه نمایید."
        )
        # In production: make HTTP request to https://api.kavenegar.com/v1/{API_KEY}/sms/send.json
        print(f"[Kavenegar SMS to {mobile}]: {message}")
        return {"status": 200, "message": "ارسال موفق پیامک"}
